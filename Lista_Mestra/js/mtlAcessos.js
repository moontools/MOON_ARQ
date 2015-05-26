(function(){
   angular.module('mtl.Acessos',[])
    .constant('configAcessos',{
        urlDevApi : 'https://script.google.com/a/macros/moontools.com.br/s/AKfycbzmpo6PfToa2KwuwlkT5f-sG6GFakZsPXB42gw1X8I/dev',
        urlExecApi : 'https://script.google.com/macros/s/AKfycbyKDTuT4a3qLxttcABSwyWugyfp5OJBttsFmWKdcdMS5mShyVM/exec'
    })
    .service('acessos',function($http,configAcessos){
    
        var _urlApi = localStorage.development == "true"? configAcessos.urlDevApi : configAcessos.urlExecApi;
        
        this.verificaAcesso = function(group,callback){
            $http({url:_urlApi+'?callback=JSON_CALLBACK',
                   method:"jsonp",
                   params:{
                       'groupEmail': group,
                   }
            }).success(function(data, status, headers, config, statusText){
               callback(data.data, data.status, data.message);
            }).error(function(data, status, headers, config, statusText){
               callback(data, false, status);
            })     
        };     
    });
})();
