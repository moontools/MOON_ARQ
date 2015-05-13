/* 
 * Inicialização do App
 */

var app = angular.module('listaMestra', ['ui.bootstrap','toggle-switch','dialogs.main','pascalprecht.translate','dialogs.default-translations']);

//// Deretiva para trabalhar com input do tipo File
app.directive("fileread", [function () {
    return {
        scope: {
            fileread: "="
        },
        link: function (scope, element, attributes) {
            element.bind("change", function (changeEvent) {
                scope.$apply(function () {
                    scope.fileread = changeEvent.target.files[0];
                });
            });
        }
    };
}]);



app.directive("loadingspinner",function(){
    return {
        restrict:'E',
        scope:{ showloading:'='},
        template:'<div id="loading-div-background"><div id="loading-div" class="ui-corner-all" >\n\
                        <img src="css/images/loading.gif" alt="Loading.."/>\n\
                        <h2 id="mensageLoading">Aguarde...</h2></div> </div>'
    };
});

app.config(['dialogsProvider','$translateProvider',function(dialogsProvider,$translateProvider){
		dialogsProvider.useBackdrop('static');
		dialogsProvider.useEscClose(false);
		dialogsProvider.useCopy(false);
		dialogsProvider.setSize('sm');

		$translateProvider.translations('es',{
			DIALOGS_ERROR: "Error",
			DIALOGS_ERROR_MSG: "Se ha producido un error desconocido.",
			DIALOGS_CLOSE: "Cerca",
			DIALOGS_PLEASE_WAIT: "Espere por favor",
			DIALOGS_PLEASE_WAIT_ELIPS: "Espere por favor...",
			DIALOGS_PLEASE_WAIT_MSG: "Esperando en la operacion para completar.",
			DIALOGS_PERCENT_COMPLETE: "% Completado",
			DIALOGS_NOTIFICATION: "Notificacion",
			DIALOGS_NOTIFICATION_MSG: "Notificacion de aplicacion Desconocido.",
			DIALOGS_CONFIRMATION: "Confirmacion",
			DIALOGS_CONFIRMATION_MSG: "Se requiere confirmacion.",
			DIALOGS_OK: "Bueno",
			DIALOGS_YES: "Si",
			DIALOGS_NO: "No"
		});

		$translateProvider.preferredLanguage('en-US');
    }]);

app.run(['$templateCache',function($templateCache){
  		$templateCache.put('/dialogs/custom.html','<div class="modal-header"><h4 class="modal-title"><span class="glyphicon glyphicon-star"></span> User\'s Name</h4></div><div class="modal-body"><ng-form name="nameDialog" novalidate role="form"><div class="form-group input-group-lg" ng-class="{true: \'has-error\'}[nameDialog.username.$dirty && nameDialog.username.$invalid]"><label class="control-label" for="course">Name:</label><input type="text" class="form-control" name="username" id="username" ng-model="user.name" ng-keyup="hitEnter($event)" required><span class="help-block">Enter your full name, first &amp; last.</span></div></ng-form></div><div class="modal-footer"><button type="button" class="btn btn-default" ng-click="cancel()">Cancel</button><button type="button" class="btn btn-primary" ng-click="save()" ng-disabled="(nameDialog.$dirty && nameDialog.$invalid) || nameDialog.$pristine">Save</button></div>');
  		$templateCache.put('/dialogs/custom2.html','<div class="modal-header"><h4 class="modal-title"><span class="glyphicon glyphicon-star"></span> Custom Dialog 2</h4></div><div class="modal-body"><label class="control-label" for="customValue">Custom Value:</label><input type="text" class="form-control" id="customValue" ng-model="data.val" ng-keyup="hitEnter($event)"><span class="help-block">Using "dialogsProvider.useCopy(false)" in your applications config function will allow data passed to a custom dialog to retain its two-way binding with the scope of the calling controller.</span></div><div class="modal-footer"><button type="button" class="btn btn-default" ng-click="done()">Done</button></div>')
	}]);

//
//app.directive("mtlinput",function(){
//    
//}).controller('')
//app.config(['$httpProvider', function($httpProvider) {
//        $httpProvider.defaults.useXDomain = true;
//        $httpProvider.defaults.headers.common = 'Content-Type: application/json';
//        delete $httpProvider.defaults.headers.common['X-Requested-With'];
//    }
//]);

