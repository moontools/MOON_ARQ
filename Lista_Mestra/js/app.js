/* 
 * Inicialização do App
 */
var app = angular.module('listaMestra', ['ui.bootstrap','ui.utils.masks','toggle-switch','dialogs.main','pascalprecht.translate','dialogs.default-translations','mtl.gdrive','mtl.googleSheet','mtl.Acessos','mtl.util']);

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

app.constant('config',{
    idSheetConfig : '1dfZqj7IIEmYFMioF2_xm_dvhjKAsScHE3PeQgos6Uj8',
    sheetConfigEmp : 'Configurações Empreendimentos',
    sheetParamsForm : 'Parâmetros Formulário',
    sheetParamsFiles : 'Níveis Gestão',
    googleDriveClienteId : '597261259365-0n3ee1mmra5lveal5a014233f4murqef.apps.googleusercontent.com',
    googleDriveScope : 'https://www.googleapis.com/auth/drive'
});






