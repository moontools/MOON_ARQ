/* 
 * Inicialização do App
 */
var app = angular.module('listaMestra', ['ui.bootstrap','toggle-switch','dialogs.main','pascalprecht.translate','dialogs.default-translations','mtl.gdrive','mtl.googleSheet','mtl.Acessos','mtl.util']);

/**
 * Configurações dos modais de dialogos 
 * @param {type} param
 */
app.config(['dialogsProvider','$translateProvider',function(dialogsProvider,$translateProvider){
       
    dialogsProvider.useBackdrop('static');
    dialogsProvider.useEscClose(false);
    dialogsProvider.useCopy(false);
    dialogsProvider.setSize('sm');
    dialogsProvider.useFontAwesome();

    // Tradução dos Modais para Portugês BR
    $translateProvider.translations('pt-br',{
            DIALOGS_ERROR: "Erro",
            DIALOGS_ERROR_MSG: "Erro inesperado.",
            DIALOGS_CLOSE: "Fechar",
            DIALOGS_PLEASE_WAIT: "Aguarde por favor",
            DIALOGS_PLEASE_WAIT_ELIPS: "Aguarde por favor...",
            DIALOGS_PLEASE_WAIT_MSG: "Aguardando a operação terminar.",
            DIALOGS_PERCENT_COMPLETE: "% Completado",
            DIALOGS_NOTIFICATION: "Notificação",
            DIALOGS_NOTIFICATION_MSG: "Notificação desconhecida.",
            DIALOGS_CONFIRMATION: "Confirmação",
            DIALOGS_CONFIRMATION_MSG: "Requer confirmação.",
            DIALOGS_OK: "OK",
            DIALOGS_YES: "Sim",
            DIALOGS_NO: "Não"
    });

    // Define a linguagem padrão para pt-br
    $translateProvider.preferredLanguage('pt-br');    
}]);


