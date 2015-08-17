/* 
 * Inicialização do App
 */
var app = angular.module('listaMestra', ['ui.bootstrap','ui.utils.masks','toggle-switch','dialogs.main','pascalprecht.translate','dialogs.default-translations','mtl.gdrive','mtl.googleSheet','mtl.Acessos','mtl.util']);

/**
 * Configurações dos modais de dialogos 
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
    
    /*
     * Função para controlar os Log em modo desenvolvimento
     * @param {string} msg Mensagem a ser exibida no console
     */
    log = function(msg){
        if(localStorage.development === "true"){
            console.log(msg);
        }
    };
}]);

/*
 * Define algumas variáveis gloabais da aplicação
 */
app.constant('config',{
    // Id da planilha principal de configuração
    idSheetConfig : '1dfZqj7IIEmYFMioF2_xm_dvhjKAsScHE3PeQgos6Uj8',
    // Nome da página onde será inseridos os dados do formulário
    nameSheetListaMestra : 'Índice Projetos',
    // Nome página revisões
    nameSheetRevisoes : 'Histórico de Revisões',
    //Nome da página onde estão localizadas as informações referente aos empreendimentos
    sheetConfigEmp : 'Configurações Empreendimentos',
    // Nome da página onde se encontram os parâmetros utilizados no formulário
    sheetParamsForm : 'Parâmetros Formulário',
    // Nome da página onde se encontram os parâmetos utilizados para manipulação dos arquivos
    sheetParamsFiles : 'Níveis Gestão',
    // ID da API Google Drive
    googleDriveClienteId : '597261259365-0n3ee1mmra5lveal5a014233f4murqef.apps.googleusercontent.com',
    // Scorpo da API Google Drive
    googleDriveScope : 'https://www.googleapis.com/auth/drive'
});



