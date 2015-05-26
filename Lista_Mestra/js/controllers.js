/**
 * Controller do formulário Lista Mestra
 * @param {object} $scope Scope do Controller
 * @param {object} mtlGdrive Objeto para comunicação com API do Google Drive
 */
app.controller('formListaMestra',function($rootScope,$scope,$timeout,mtlGdrive,googleSheet,$timeout,$translate,dialogs,lmFiles,util,acessos,configAcessos){
             
    // Inicializao o objeto do formulário
    $scope.registro = new Object();
    
    // Incializa o objeto utilzados para carregar parâmetros no formulário
    $scope.params = new Object();
    
    $scope.registro.empreendimento = util.QueryString.empreendimento;
    
    // Seta os parâmetros utilizados pela API do Google Drive
    // e checa a autenticação do usuário
    mtlGdrive.setClientId('597261259365-0n3ee1mmra5lveal5a014233f4murqef.apps.googleusercontent.com');
    mtlGdrive.setScopes('https://www.googleapis.com/auth/drive');
    mtlGdrive.checkAuth();
    
    /**
     * Função padrão para mensagem de erro
     * @param {type} message Texto adicional para ser exibido na mensagem de erro
     * @returns {Boolean}
     */
    var showError = function(message){
        if(!$scope.showErrorOpen){
            var dlg = dialogs.error('Erro','Ocorreu um erro inesperado! Tente novamente mais tarde, se o problema persistir informe o erro para Moon Tools.<br/><br/>Erro: '+message);
            $scope.showErrorOpen = true;
            dlg.result.then(function(btn){
                 $scope.showErrorOpen = false;
            });
        }
        $rootScope.$broadcast('dialogs.wait.complete');
        return false;
    };
    
    /*
     * Função para ativar o popup do calendário
     * @param {type} $event
     * @returns {undefined}
     */
    $scope.openCalendar = function($event) {
        $event.preventDefault();
        $event.stopPropagation();
        $scope.opened = true;
    };
    
    // Mostra o Loading na página
    $scope.messageLoading = "Autenticando usuário...";
    $scope.spinerloading = true;
    
    // Seta parâmetros utilizados pela API do Apps Script
    googleSheet.setSpreadSheetId('1dfZqj7IIEmYFMioF2_xm_dvhjKAsScHE3PeQgos6Uj8');
    
    // Carrega as configurações dos empreendimentos
    googleSheet.setSheetName('Configurações Empreendimentos');
    googleSheet.getColumnData(['empreendimento','idPlanilha','idPastaRaiz','emailGrupo'],'associativeArray',function(data, status, message){
        $scope.params.configEmpreendimentos = status ? data : showError(message);
        for(var i in $scope.params.configEmpreendimentos){
            if($scope.registro.empreendimento == $scope.params.configEmpreendimentos[i].empreendimento){
                $scope.params.emailGrupo = $scope.params.configEmpreendimentos[i].emailGrupo;
                break;
            }
        }
        if(!$scope.params.emailGrupo){
            $scope.spinerloading = false;
            return showError("Empreendimento inválido!");
        }
        verificaAcesso($scope.params.emailGrupo);
    });
    
    verificaAcesso = function(emailGrupo){
        // Verifica se o usuário tem acesso
        acessos.verificaAcesso(emailGrupo,function(data, status, message){
            if(status && data){

                $scope.registro.usuario = data;
                $scope.params.acesso = true;
                carregaParamsForm();
            }else if(!status && data){
                $scope.registro.usuario = data;
                $scope.params.acesso = false;
                $scope.params.erroAcesso = message;
            }else{
                var dlg = dialogs.error('Erro','Erro ao autenticar usuário. <br>\n\
                                        Se você estiver acessando esse formulário pela primeira vez, por favor\n\
                                        acesse o link a seguir e autorize o mesmo:<br><br>\n\
                                        <a href="'+configAcessos.urlExecApi+'" target="_self">API Acesso</a><br/><br/>');
                $scope.showErrorOpen = true;
                dlg.result.then(function(btn){
                     $scope.showErrorOpen = false;
                });
            }
            $scope.spinerloading = false;
        });
    }
    
    
    /**
     * Inicializa o carregamento dos parâmetros necessário para o funcionamento do formulário 
     * ************************************************************************************************
     **/
    
    carregaParamsForm = function(){
        
        googleSheet.setSheetName('Parâmetros Formulário');
        
        // Carrega o select Cliente
        googleSheet.getColumnData(["cliente"],"array",function(data, status, message){
            $scope.params.cliente = data;
        });

        // Carrega o select Projeto
        googleSheet.getColumnData(["projeto"],"array",function(data, status, message){
            $scope.params.projeto = status ? data : showError(message);
        });

        // Carrega o select Responsável Técnico
        googleSheet.getColumnData(["responsavelTecnico"],"array",function(data, status, message){
            $scope.params.responsavelTecnico = status ? data : showError(message);
        });

        // Carrega o select Complemento
        googleSheet.getColumnData(["detalhamento"],"array",function(data, status, message){
            $scope.params.detalhamento = status ? data : showError(message);
        });

        // Carrega as configurações de localização de arquivos
        googleSheet.setSheetName('Níveis Gestão');
        googleSheet.getColumnData(['entregaveis','localizacaoNoSistema'],'associativeArray',function(data, status, message){
            $scope.params.configArquivos = status ? data : showError(message);
        });

        //Exibe os Blocos dos empreendimentos
        $scope.params.bloco = null;
        googleSheet.setSheetName("Parâmetros Formulário");
        if($scope.registro.empreendimento)
            googleSheet.getColumnData([util.normalizeHeaders('Blocos '+$scope.registro.empreendimento)],'array',function(data, status, message){
                $scope.params.bloco = status ? data : showError(message);
            });
    };
    
    /*
     * Adiciona elementos ao input complemento
     */
    $scope.showComplementos = function(){
        googleSheet.setSpreadSheetId('1dfZqj7IIEmYFMioF2_xm_dvhjKAsScHE3PeQgos6Uj8');
        googleSheet.setSheetName("Parâmetros Formulário");
        $scope.params.complemento = null;
        $scope.registro.complemento = "";
        googleSheet.getColumnData(['pertenceAoProjeto','complemento'],'associativeArray',function(data, status, message){
            if(status){
                $scope.params.complemento = [];
                angular.forEach(data,function(object){
                   if(object.pertenceAoProjeto === $scope.registro.projeto)
                   $scope.params.complemento.push(object.complemento); 
                });
            }else{
                showError(message);
            }
        });
    };
   
    
    /**
     * ************************************************************************************************
     * FIM Carregamento dos parâmetros
     **/

    /**
     * Função executada quando o formulário é submetido
     * @returns {undefined}
     */
    $scope.salvar = function(){
        var dlg = dialogs.confirm("Confirmação","Deseja realmente gravar o registro ?");
        console.log($scope.registro);
        dlg.result.then(function(btn){
             $scope.confirmSalvar();
        },function(btn){
                
        });  
    };
        
    /**
     * Função executada quando o usuário confirma o envio do formulário
     * @returns {undefined}
     */
    $scope.confirmSalvar = function(){
        
        // Inicializa o progresso da operação salvar 
        var _progress = 0;
        var _progressMessage = "Processando...";
        var dlg = dialogs.wait("Aguarde.",_progressMessage,_progress);
        
        /*
         * Atualiza o progresso do processo de envio dos dados
         */
        (atualizaProgress = function(){
            $timeout(function(){
                $rootScope.$broadcast('dialogs.wait.progress',{'progress' : _progress,'msg':_progressMessage});
                if(_progress < 100)
                    atualizaProgress();
            },1000);
        })();
        
        // Faz o tratamento das indicações das pastas
        $scope.registro.servidorTerra = $scope.registro.servidorTerra ? "SIM":"NÃO";
        $scope.registro.pastaFisicaCliente = $scope.registro.pastaFisicaCliente ? "SIM":"NÃO";
        $scope.registro.pastaFisicaTerra = $scope.registro.pastaFisicaTerra ? "SIM":"NÃO";
        
        // Faz o tratamento da informação Blocos
        var auxBlocos = "";
        for(var i in $scope.registro.blocos){
           auxBlocos += i+" ";
        }
        $scope.registro.blocos = auxBlocos;
        
        // Faz o tratamento da informação Detalhamento
        if($scope.registro.detalhamento === 'OUTRO'){
            $scope.registro.detalhamento = $scope.registro.outroDetalhamento;
        }
        delete $scope.registro.outroDetalhamento;
        
        
        // Procura pelas propriedades do empreendimento
        for(var i = 0; i < $scope.params.configEmpreendimentos.length; i++){
            if($scope.params.configEmpreendimentos[i].empreendimento === $scope.registro.empreendimento){
                var idPlanilha = $scope.params.configEmpreendimentos[i].idPlanilha;
                $scope.params.idPastaRaiz = $scope.params.configEmpreendimentos[i].idPastaRaiz;
                break;
            }
        }
        
        // Busca pelas configurações de localização dos arquivos
        var entregavel = $scope.registro.projeto+($scope.registro.complemento ? " "+$scope.registro.complemento : "");
        $scope.params.folderDestino = "";
        for(var i = 0; i < $scope.params.configArquivos.length; i++){
            if($scope.params.configArquivos[i].entregaveis === entregavel){
                $scope.params.folderDestino = $scope.params.configArquivos[i].localizacaoNoSistema;
                break;
            }
        }
        
        // Faz manipulação dos arquivos para enviar para o Google Drive
        var arrayArquivos = [
            {id : "arquivoEditavel",description:"Arquivo Editável", file: $scope.registro.arquivoEditavel},
            {id : "arquivoImpressao",description:"Arquivo Impressão", file:$scope.registro.arquivoImpressao},
            {id : "arquivoPdf",description:"Arquivo Pdf", file:$scope.registro.arquivoPdf}
        ];
        
        // Monta o nome do arquivo
        var nomeArquivo = $scope.registro.cliente;
            nomeArquivo += " "+$scope.registro.empreendimento;
            nomeArquivo += " "+$scope.registro.projeto;
            nomeArquivo += $scope.registro.complemento? " "+$scope.registro.complemento : "";
            nomeArquivo += $scope.registro.nGrupoPranchas? " "+$scope.registro.nGrupoPranchas : "";
            nomeArquivo += $scope.registro.blocos? " BLOCOS "+$scope.registro.blocos : "";
            nomeArquivo += $scope.registro.numeroPrancha? " "+$scope.registro.numeroPrancha : "";
            nomeArquivo += " "+$scope.registro.descricaoArquivo;
        
        // Iniciar a verificação de arquivos para upload
        (uploadFile = function(){
            if(arrayArquivos.length > 0){
                _progressMessage = "Gravando "+arrayArquivos[0].description+"...";
                if(typeof(arrayArquivos[0].file) === "object"){
                    // Seta as configurações necessárias para enviar os arquivos para o Drive
                    lmFiles.setFolderRaiz($scope.params.idPastaRaiz);
                    lmFiles.setPatchFolder($scope.params.folderDestino);
                    lmFiles.setFile(arrayArquivos[0].file,nomeArquivo);
                    // Iniciar o upload do arquivo
                    lmFiles.uploadFile(function(status,data,message){
                        if(!status){
                            
                            return showError(message);
                        }
                        $scope.registro[arrayArquivos[0].id] = data;
                        // Atualiza o progresso da operação 
                        _progress = _progress + 25;
                        arrayArquivos.shift();
                        uploadFile(arrayArquivos);
                    });
                }else{
                    // Atualiza o progresso da operação 
                    _progress = _progress + 25;
                    arrayArquivos.shift();
                    uploadFile(arrayArquivos);
                }   
            }else{
                gravaDadosPlanilha();
            }
        })();
        
        /*
         * Inicia a gravação dos dados na planilha do Google
         */        
        gravaDadosPlanilha = function(){
            // Seta o ID da planilha e nome da página a serem gravados os dados
            googleSheet.setSpreadSheetId(idPlanilha);
            googleSheet.setSheetName('Índice Projetos');
            _progressMessage = "Gravando dados na planilha...";
            // Insere o registro na planilha
            googleSheet.insertRecord($scope.registro,function(data, status, message){
                // Atualiza o progresso da operação 
                _progress = _progress + 25;
                // Verifica se o processo de inserção dos dados e gravação dos arquivos terminou
                (verificaTermino = function(){
                    $timeout(function(){
                        if(_progress>=100){
                            $rootScope.$broadcast('dialogs.wait.complete');
                            // Verifica o status retornado pelo request
                            if(status){
                                dialogs.notify("Status",message);
                                // Reseta o formulário
                                $scope.formListaMestra.$setPristine();
                                var auxEmp = $scope.registro.empreendimento;
                                var auxUsr = $scope.registro.usuario;
                                $scope.registro = {};
                                $scope.registro.empreendimento = auxEmp;
                                $scope.registro.usuario = auxUsr;
                                $scope.params.complemento = null;
                            }else{
                                dialogs.error("Erro",message);
                            }  
                        }else{
                           verificaTermino();
                        }   
                    },1000);   
                })();
            });
        };    
        
        
        
    };
    
    $scope.teste = function(){
        
//        // Procura pelas propriedades do empreendimento
//        for(var i = 0; i < $scope.params.configEmpreendimentos.length; i++){
//            if($scope.params.configEmpreendimentos[i].empreendimento === $scope.registro.empreendimento){
//                var idPlanilha = $scope.params.configEmpreendimentos[i].idPlanilha;
//                $scope.params.idPastaRaiz = $scope.params.configEmpreendimentos[i].idPastaRaiz;
//                break;
//            }
//        }
//        // Busca pelas configurações de localização dos arquivos
//        var entregavel = $scope.registro.projeto+" "+$scope.registro.complemento;
//        for(var i = 0; i < $scope.params.configArquivos.length; i++){
//            if($scope.params.configArquivos[i].entregaveis === entregavel){
//                $scope.params.folderDestino = $scope.params.configArquivos[i].localizacaoNoSistema;
//                break;
//            }
//        }

        lmFiles.setFolderRaiz("0B7C12ldJ-VYWTzlwN0RKeklmNFU");
        lmFiles.setPatchFolder("ARQ/ 02 Parcelamento do Solo/ 01 Retificação");
        lmFiles.setFile($scope.registro.arquivoPdf,"TESTE");
        lmFiles.uploadFile(function(status,data,message){
            if(!status)
                showError(message);
        });
        
        
    };
    
    $scope.teste2 = function(){
        $scope.testeAnimation = $scope.testeAnimation ? false: true;
    };

    
  });
