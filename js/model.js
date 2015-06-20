/**
 * Created by sdm on 14-1-18.
 * Editor by Riant on 15-04-16
 * 数据存储类
 *
 * 使用 数据库 存储
 * 参考 http://www.webkit.org/demos/sticky-notes/index.html
 *     http://html5doctor.com/introducing-web-sql-databases/
 *
 *     这里使用
 *     localStorage 序列化存储
 *
 */

(function (window) {
    var model = {};

    //推荐的ip
    var ips=[];
    //字段提示的domain
    var domains=[];

    function uniq_arr(arr,key){
        var dic={}
        for(var i=0;i<arr.length;i++){
            var t=arr[i];
            dic[t[key]]=t;
        }
        var j=0;
        arr.length=0;
        for(var k in dic){
            if(dic.hasOwnProperty(k)){
                arr.push(dic[k]);
                j++;
            }
        }
        return arr;
    }

    function loadsIp(){
        var hosts= loadData('hosts');
        ips.splice(0,ips.length);
        for(var i in hosts){
            ips.push({ip: hosts[i].ip });
            domains.push({domain:hosts[i].domain});
        }

        uniq_arr(ips,'ip');
        uniq_arr(domains,'domain');

        if(last_callback_ip){
            last_callback_ip(ips);
        }
        if(last_callback_domain){
            last_callback_domain(domains);
        }
    }
    //第一次加载
    loadsIp()

    var last_callback_ip=false;
    var last_callback_domain=false;

    model.setAutoIp=function(callback){
        callback(ips);
        last_callback_ip=callback
    }
    model.setAutoDomain=function(callback){
        callback(domains);
        last_callback_domain=callback
    }

    /**
     * 获取标签 有那些
     */
    model.getTags = function () {
        return loadData('tags');
    }


    //添加标签
    model.addTag = function (tagname, description) {
        var tags = model.getTags();
        tags[name] = {desc: description};
        saveData('tags', tags);
    }

    //删除标签
    model.removeTag = function (tagname) {
        var tags = model.getTags();
        delete tags[name];
    }

    //获取列表
    model.getHosts = function () {
        var result = []
        var hosts = loadData('hosts');
        for (var id in hosts) {
            if (hosts.hasOwnProperty(id)) {
                result.push(hosts[id]);
            }
        }
        return result;
    }

    //添加主机
    model.addHost = function (info, enable) {
        if( info.id ){
            model.updateHost(info);
        } else {
            var hosts = loadData('hosts');
            var c = loadData('hosts-count');
            if (!c) {
                c = 0;
            }
            if (!hosts) {
                hosts = {};
            }
            var id = 1 + c;
            info.status = 0;
            info.id = id;

            saveData('hosts-count', id);

            hosts[id] = info;

            saveData('hosts', hosts);

            //修改之后 更新
            loadsIp()
            //自动启动
            if( enable ) model.enableHosts([id]);
            model.reload();
        }
    }


    model.clearkws = function () {
        saveData('kws',[])

    }

    model.getkws = function () {
        var kws = loadData('kws');
        if (!kws) {
            kws = [];
        }
        return kws;
    }

    model.saveKw = function (kw) {
        if (!kw) {
            return;
        }
        //存储搜索记录
        var kws = loadData('kws');
        if (!kws || !kws.splice) {
            kws = [];
        }


        kws.splice(0, 0, kw);
        var kws2 = []
        var kw_map = {}
        for (var i = 0; i < kws.length; i++) {
            var kw = kws[i];
            if (!kw_map[kw]) {
                kws2.push(kw);
            }
            kw_map[kws[i]] = 1;
        }
        kws = kws2.slice(0, 10);


        saveData('kws', kws);
    }
    model.search = function (kw) {
        kw = kw || '';
        model.saveKw(kw);
        var hosts = model.getHosts();

        //filter
        var kws=kw.split(/\s+/);
        for(var i=0;i<kws.length;i++){
            kw=kws[i]

            if (kw) {
                hosts = hosts.filter(function (v) {
                    //单独字段搜索模式
                    if(kw.indexOf(':')!=-1){
                        var arr=kw.split(':');
                        if(v[arr[0]]&& v[arr[0]].indexOf(arr[1])!=-1){
                            return true;
                        }else{
                            return false;
                        }
                    }

                    if (v.domain && v.domain.indexOf(kw) != -1) {
                        return true;
                    }
                    if (v.ip &&  v.ip.indexOf(kw) != -1) {
                        return true;
                    }
                    if(v.tags && v.tags.length && v.tags.indexOf(kw)!=-1){
                        return true;
                    }
                    return false;
                })

            }
        }
        return hosts;
    }

    model.countTotal = function() {
    	var hosts = loadData('hosts');
    	var count = 0;
        for (var i in hosts) {
            if (hosts.hasOwnProperty(i)) {
            	count++;
            }
        }
        return count;
    }

    /**
     * 获取标签的统计
     * @returns {Array}
     */
    model.countTags = function () {
        var tags = {
            'common': 0,
            'dev': 0,
            'test': 0
        }
        var hosts = loadData('hosts');
        for (var i in hosts) {
            if (hosts.hasOwnProperty(i)) {
                var host = hosts[i];
                if (host.tags && host.tags.push) {
                    for (var x = 0; x < host.tags.length; x++) {
                        var tag = host.tags[x];
                        if (!tags[tag]) {
                            tags[tag] = 0;
                        }
                        tags[tag]++;
                    }
                }

            }
        }
        var result = []
        for (var i in tags) {
            if (tags.hasOwnProperty([i])) {
                result.push({'name': i, 'count': tags[i]});
            }
        }
        return result;
    }

    model.getStatus = function(){
        return loadData('status') ? loadData('status') : 0;
    }

    // 查询当前生效的所有hosts
    model.getEnabledHosts=function(){
        var results=[];
        $(model.getHosts()).each(function(i,v){
        	if(v.status == 1) {
        		results.push(v);
        	}
        });
        return results;
    }
    
    //重新加载
    model.reload=function(){
        model.setStatus(loadData('status'));
    }
    
    // 如果url是http://或https://后面带上的url没有带/，则加上
    function appendSlash(url) {
    	var pureurl = url;
    	if(url.indexOf('http://') == 0) {
    		pureurl = url.substr(7);
    	} else if(url.indexOf('https://') == 0) {
    		pureurl = url.substr(8);
    	}
    	return pureurl.indexOf('/') < 0 ? url + '/' : url;
    }
    
    // 当url以/结尾时，自动加上*号
    function autoAppendWildcard(url) {
    	return url.lastIndexOf('/') == url.length - 1 ?
    			url + '*' : url;
    }

    //开关,启用暂停
    model.setStatus = function (checked) {
        saveData('status',checked);
        this.checked = checked;

        var script = '';
        
        if (this.checked) {

            var results=model.getEnabledHosts();
            for(var i =0;i<results.length;i++){
                var info=results[i];
                
                // XXX 【注意】目前不支持https绑hosts的方式，因为https的443不会兼容作为http代理
                // 对于这种情况，还是需要修改系统hosts文件，有这样的chrome插件完成这个事

                /**
                 * @author pugwoo
                 * info.domain扩展为:
                 * 1. 如果http:或https:开头，则使用shExpMatch匹配url，此时请写清楚*匹配符
                 * 2. 如果值只是host形式（等价于没有带/），包括星号格式，那么匹配host
                 *    如果填入google.com，那么不会匹配所有子域名，请用*.google.com
                 * 3. 如果不是上面两种，那么匹配http和https的url方式
                 */
                var domain = info.domain;
                if(domain.indexOf('http://') == 0 || domain.indexOf('https://') == 0) {
                	script += '}else if(shExpMatch(url,"' + 
                	          autoAppendWildcard(appendSlash(domain)) + '")){';
                } else if (domain.indexOf('/') < 0) {
                	script += '}else if(shExpMatch(host,"' + domain + '")){';
                } else {
                	var _domain = autoAppendWildcard(domain);
                	script += '}else if(shExpMatch(url,"http://' + _domain +
                	          '") || shExpMatch(url,"https://' + _domain + 
                	       '")){';
                }

                /**
                 * @author pugwoo
                 * 扩展为：ip如果是SOCKS开头的话，那么代理服务器以SOCKS5为开头，目前只支持socks5，socks4实在没必要
                 * 如果ip是PROXY或HTTP开头，那么代理服务器以PROXY开头，
                 * 默认以PROXY开头
                 */
                var ip = info.ip;
                var proxyType = 'PROXY';
                if(ip.indexOf('SOCKS') == 0) {
                	proxyType = 'SOCKS5';
                	ip = ip.substr(5);
                } else if (ip.indexOf('PROXY') == 0) {
                	proxyType = 'PROXY';
                	ip = ip.substr(5);
                } else if (ip.indexOf('HTTPS') == 0) {
                	proxyType = 'HTTPS';
                	ip = ip.substr(5);
                } else if (ip.indexOf('HTTP') == 0) { 
                	proxyType = 'PROXY';
                	ip = ip.substr(4);
                }
                var port = 80;
                if(ip.indexOf(':') !== -1){
                    var ip_port = ip.split(':');
                    ip = ip_port[0];
                    port = ip_port[1];
                }
                script += 'return "' + proxyType + ' ' + ip + ':'+ port +'";';
            }
            
            var data='function FindProxyForURL(url,host){' + 
                'if(shExpMatch(url,"http:*") || shExpMatch(url,"https:*")){' + 
                     'if(false){' + // 去掉isPlainHostName(host)限制，没必要
                      script + 
                      '} else {return "DIRECT";}' +
                  '}else{return "DIRECT";}' + 
                '}';
            
            chrome.proxy.settings.set({
                value: {
                    mode: 'pac_script',
                    pacScript: {
                        data:data
                    }
                },
                scope: 'regular'
            }, function(){
                //console.log('set pac scripts result:',arguments);
            });
            $('#msg').html('set :' + script);
        } else {
            chrome.proxy.settings.set({
                value: {
                    //mode: 'system'
                    mode: 'direct'
                },
                scope: 'regular'
            }, $.noop);
        }
    }
    //移除主机
    model.removeHost = function (id) {
        var hosts = loadData('hosts');
        model.disableHosts(id);
        delete hosts[id];
        saveData('hosts', hosts);
        model.reload();
    }

    model.enableHosts = function (ids) {
        var hosts = loadData('hosts');
        for (var i = 0; i < ids.length; i++) {
            if (hosts[ids[i]]) {
                hosts[ids[i]].status = 1;
            }
        }

        saveData('hosts', hosts);
        model.reload();
    }
    
    model.disableHosts = function (ids) {
        var hosts = loadData('hosts');
        for (var i = 0; i < ids.length; i++) {
            if (hosts[ids[i]]) {
                hosts[ids[i]].status = 0;
            }
        }

        saveData('hosts', hosts);
        model.reload();
    }
    
    // 禁用掉除了指定tag之外的所有配置，特别的，当tags包含空字符串时表示没有tag的配置不disable
    model.disableTagExcept = function(tags) {
    	var hosts = loadData('hosts');
    	for(var key in hosts) {
    		if(hosts.hasOwnProperty(key)) {
    			var disable = true;
    			for(var i = 0; i < tags.length; i++) {
    				if(tags[i] == '') {
    					if(hosts[key].tags.length == 0) {
        					disable = false;
        					break;
    					}
    				} else {
    					if(hosts[key].tags.indexOf(tags[i]) >= 0) {
    						disable = false;
    						break;
    					}
    				}
    			}
    			if(disable) {
    				hosts[key].status = 0;
    			}
    		}
    	}
    	
        saveData('hosts', hosts);
        model.reload();
    }

    model.updateHost = function (info) {
        var hosts = loadData('hosts');
        var origin_status = (hosts[info.id]).status;

        info.status = 0;
        hosts[info.id] = info;
        saveData('hosts', hosts);
        if( origin_status ){
            model.enableHosts([info.id]);
        }

        model.reload();
    }


    function saveData(name, value) {
        localStorage[name] = JSON.stringify(value);
    }

    function loadData(name) {
        var s = localStorage[name];
        if (s) {
            try {
                return JSON.parse(s);
            } catch (e) {

            }
        }
        return false;
    }

    window.Model = model;

    // init status as true
    if( localStorage['status'] === undefined ){
        model.setStatus(true);
    }
})(window);