/**
 * Controller do formulário Lista Mestra
 * @param {object} $scope Scope do Controller
 * @param {object} mtlGdrive Objeto para comunicação com API do Google Drive
 */
app.controller('formListaMestra',function($scope,mtlGdrive,googleSheet,$timeout,$translate,dialogs){
       
    // Mostra o Loading na página
    $scope.messageLoading = "Aguarde...";
    $scope.spinerloading = true;
  
    // Seta os parâmetros utilizados pela API do Google Drive
    mtlGdrive.setClientId('597261259365-0n3ee1mmra5lveal5a014233f4murqef.apps.googleusercontent.com');
    mtlGdrive.setScopes('https://www.googleapis.com/auth/drive');
    // Checa a autenticação do usuário
    mtlGdrive.checkAuth();
    
    // Seta parâmetros utilizados pela API do Apps Script
    googleSheet.setSpreadSheetId('1dfZqj7IIEmYFMioF2_xm_dvhjKAsScHE3PeQgos6Uj8');
    googleSheet.setSheetName('Parâmetros Formulário');
    			

    // Inicializao o objeto do formulário
    $scope.registro = new Object();
    // Incializa o objeto utilzados para carregar parâmetros no formulário
    $scope.params = new Object();
    
    $scope.registro.usuario = "deividi@moontools.com.br";
    
    /**
     * Carrega o select Cliente 
     */
    googleSheet.getColumnData(["cliente"],"array",function(data, status, message){
        $scope.params.cliente = data;
    });
    
    /**
     * Carrega o select Empreendimento 
     */
    googleSheet.getColumnData(["empreendimento","idPlanilha"],"associativeArray",function(data, status, message){
        $scope.params.empreendimento = data;
    });
    
    /**
     * Carrega o select Projeto 
     */
    googleSheet.getColumnData(["projeto"],"array",function(data, status, message){
        $scope.params.projeto = data;
    });
    
    /**
     * Carrega o select Responsável Técnico 
     */
    googleSheet.getColumnData(["responsavelTecnico"],"array",function(data, status, message){
        $scope.params.responsavelTecnico = data;
    });
    
    /**
     * Carrega o select Complemento 
     */
    googleSheet.getColumnData(["complemento"],"array",function(data, status, message){
        $scope.params.complemento = data;
        $scope.spinerloading = false;
    });
    
    
    $scope.salvar = function(){
        var dlg = dialogs.confirm();
        
        dlg.result.then(function(btn){
             $scope.confirmSalvar();
        },function(btn){
                
        });  
    };
        
    /**
     * Função executada quando o formulário é submetido
     * @returns {undefined}
     */
    $scope.confirmSalvar = function(){
        console.log($scope.registro);

        $scope.registro.servidorTerra = $scope.registro.servidorTerra ? "Sim":"Não";
        $scope.registro.pastaFisicaCliente = $scope.registro.pastaFisicaCliente ? "Sim":"Não";
        $scope.registro.pastaFisicaTerra = $scope.registro.pastaFisicaTerra ? "Sim":"Não";

        // Procura pelo Id da Planilha
        for(var i = 0; i < $scope.params.empreendimento.length; i++){
            if($scope.params.empreendimento[i].empreendimento == $scope.registro.empreendimento)
                var idPlanilha = $scope.params.empreendimento[i].idPlanilha;
        }

        // Seta o ID da planilha e nome da página a serem gravados os dados
        googleSheet.setSpreadSheetId(idPlanilha);
        googleSheet.setSheetName('Índice Projetos');

        // Mostra o Loading na página
        $scope.messageLoading = "Aguarde gravando dados...";
        $scope.spinerloading = true;
        
        // Insere o registro na planilha
        googleSheet.insertRecord($scope.registro,function(data, status, message){
            // Esconde o loading da página
            $scope.spinerloading = false;
            if(status){
                console.log(message);
                $scope.formListaMestra.$setPristine();
                $scope.registro = {};
            }else{
                console.log(message);
            }
        });

    };    
    
  });