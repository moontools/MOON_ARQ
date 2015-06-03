/**
 * Controller do formulário Lista Mestra
 * @param {object} $scope Scope do Controller
 * @param {object} mtlGdrive Objeto para comunicação com API do Google Drive
 */
app.controller('formListaMestra',function($rootScope,$http,$scope,$filter,$timeout,mtlGdrive,googleSheet,$timeout,$translate,dialogs,lmFiles,util,acessos,configAcessos){
             
    // Inicializao o objetos utilizados pelo formulário
    $scope.registro = new Object();
    $scope.params = new Object();
    $scope.buttons = new Object();
    
    $scope.registro.empreendimento = util.QueryString.empreendimento;
    $scope.registro.codigo = util.QueryString.codigo;
    
    // Seta os parâmetros utilizados pela API do Google Drive
    // e checa a autenticação do usuário
    mtlGdrive.setClientId('597261259365-0n3ee1mmra5lveal5a014233f4murqef.apps.googleusercontent.com');
    mtlGdrive.setScopes('https://www.googleapis.com/auth/drive');
    mtlGdrive.checkAuth();
        
    // Mostra o Loading na página
    $scope.messageLoading = "Autenticando usuário...";
    $scope.spinerloading = true;
    
    // Seta parâmetros utilizados pela API do Apps Script
    googleSheet.setSpreadSheetId('1dfZqj7IIEmYFMioF2_xm_dvhjKAsScHE3PeQgos6Uj8');
    
    // Carrega as configurações dos empreendimentos
    googleSheet.setSheetName('Configurações Empreendimentos');
    googleSheet.getColumnData(['empreendimento','idPlanilha','idPastaRaiz','emailGrupo','nomePagina'],'associativeArray',function(data, status, message){
        $scope.params.configEmpreendimentos = status ? data : showError(message);
        for(var i in $scope.params.configEmpreendimentos){
            if($scope.registro.empreendimento === $scope.params.configEmpreendimentos[i].empreendimento){
                $scope.params.emailGrupo = $scope.params.configEmpreendimentos[i].emailGrupo;
                $scope.params.idPlanilha = $scope.params.configEmpreendimentos[i].idPlanilha; 
                $scope.params.nomePagina = $scope.params.configEmpreendimentos[i].nomePagina;
                break;
            }
        }
        if(!$scope.params.emailGrupo){
            $scope.spinerloading = false;
            return showError("Empreendimento inválido!");
        }
        verificaAcesso($scope.params.emailGrupo);
    });
    
    /*
     * Verifica se o usuário pode acessar o formulário
     * @param {string} emailGrupo email do grupo a ser consultado
     */
    verificaAcesso = function(emailGrupo){
        acessos.getAccessByGroup(emailGrupo,function(data, status, message){
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
                                        Se você estiver acessando este formulário pela primeira vez, por favor\n\
                                        acesse o link a seguir e autorize o mesmo:<br><br>\n\
                                        <a href="'+configAcessos.urlExecApi+'" target="_self">API Acesso</a><br/><br/>');
                $scope.showErrorOpen = true;
                dlg.result.then(function(btn){
                     $scope.showErrorOpen = false;
                });
            }
            if(!$scope.registro.codigo)
                $scope.spinerloading = false;
        });
    };
      
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
        googleSheet.getColumnData([util.normalizeHeaders("Responsável Técnico "+$scope.registro.empreendimento)],"array",function(data, status, message){
            $scope.params.responsavelTecnico = status ? data : showError(message);
        });
        
        /*
         * Adiciona elementos ao select detalhamento 
         * @param {string} detalhamento detalhamento a ser selecionado automaticamente (Opcional)
         * @returns {undefined}
         */
        $scope.showDetalhamentos = function(detalhamento){
           googleSheet.setSpreadSheetId('1dfZqj7IIEmYFMioF2_xm_dvhjKAsScHE3PeQgos6Uj8');
           googleSheet.setSheetName("Parâmetros Formulário");
           $scope.params.detalhamento = null;
           $scope.registro.detalhamento = "";
           googleSheet.getColumnData(['pertenceAoComplemento','detalhamento'],'associativeArray',function(data, status, message){
               if(status){
                   $scope.params.detalhamento = [];
                   angular.forEach(data,function(object){
                      if(object.pertenceAoComplemento === $scope.registro.complemento)
                      $scope.params.detalhamento.push(object.detalhamento); 
                   });
                   if(detalhamento && $scope.params.detalhamento.indexOf(detalhamento) < 0){
                       $scope.registro.detalhamento = 'OUTRO';
                       $scope.registro.outroDetalhamento = detalhamento;
                   }else if(detalhamento){
                       $scope.registro.detalhamento = detalhamento;
                   }
               }else{
                   showError(message);
               }
           });
        };

        // Carrega as configurações de localização de arquivos
        googleSheet.setSheetName('Níveis Gestão');
        googleSheet.getColumnData(['entregaveis','localizacaoNoSistema','etapasTerra','tipoProjeto','codigoEtapa','descricaoNivel1','descricaoNivel2','descricaoNivel3','descricaoNivel4'],'associativeArray',function(data, status, message){
            $scope.params.configArquivos = status ? data : showError(message);
        });

        //Exibe os Blocos dos empreendimentos
        $scope.params.bloco = null;
        googleSheet.setSheetName("Parâmetros Formulário");
        if($scope.registro.empreendimento)
            googleSheet.getColumnData([util.normalizeHeaders('Blocos '+$scope.registro.empreendimento)],'array',function(data, status, message){
                $scope.params.bloco = status ? data : showError(message);
            });
        
        
        /*
        * Adiciona elementos ao input complemento
        * @param {string} complemento complemento a ser selecionado automaticamente (Opcional)
        * @param {string} detalhamento detalhamento a ser selecionado automaticamente (Opcional)
        */
       $scope.showComplementos = function(complemento,detalhamento){
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
                   $scope.registro.complemento = complemento ? complemento : "";
                   if(detalhamento)
                        $scope.showDetalhamentos(detalhamento); 
               }else{
                   showError(message);
               }
           });
       };
       // Verifica se existe um códio pré definiddo, caso positivo quer dizer que é uma atualização de registro
       if($scope.registro.codigo)
            carregaDadosRegistro();
    };
    /*
     * Carrega o formulário com os dados de um registro salvo na planilha
     */
    carregaDadosRegistro = function(){
        $scope.messageLoading = "Carregando dados...";
        googleSheet.setSpreadSheetId($scope.params.idPlanilha);
        googleSheet.setSheetName($scope.params.nomePagina);
            $timeout(function(){
                // Verifica se todos os parâmetros básicos foram carregados
                if($scope.params.cliente && $scope.params.projeto && $scope.params.responsavelTecnico && $scope.params.bloco){
                    googleSheet.getRecord("Código",$scope.registro.codigo,function(result){
                        
                        // Carrega os dados no objeto registro
                        $scope.registro = result;
                        console.log($scope.registro);
                        // Converte a string em data
                        $scope.registro.dataDocumento = new Date($scope.registro.dataDocumento);

                        // Ativa os checkbox dos blocos
                        var auxBlocos = $scope.registro.blocos.split(" ");
                        $scope.registro.blocos = {};
                        for(var i in auxBlocos){
                            $scope.registro.blocos[auxBlocos[i]] = true;
                        }
                        
                        
                        // Ativa os botões toggle Switch que indicam a localização dos arquivos físicos
                        $scope.buttons.ServidorTerra = $scope.registro.servidorTerra === "SIM" ? true : false;
                        $scope.buttons.PastaFisicaCliente = $scope.registro.pastaFisicaCliente === "SIM" ? true : false;
                        $scope.buttons.PastaFisicaTerra = $scope.registro.pastaFisicaTerra === "SIM" ? true : false;
                        console.log($scope.registro.complemento);
                        console.log($scope.registro.detalhamento);
                        if(!$scope.registro.complemento && !$scope.registro.detalhamento){
                            console.log("Entrei aqui...");
                            $scope.spinerloading = false;
                        }else{
                            var _auxComplemento = $scope.registro.complemento;
                            var _auxDetalhamento = $scope.registro.detalhamento;
                            // Popula os select complemento e detalhamento se ouver
                            $scope.showComplementos($scope.registro.complemento,$scope.registro.detalhamento);
                            
                            (function verificaCarregamentoDados(){
                                $timeout(function(){
                                    console.log("Verificando...");
                                    if($scope.registro.complemento && ((_auxDetalhamento && $scope.registro.detalhamento) || (!_auxDetalhamento))){
                                        $scope.spinerloading = false;
                                    }else{
                                        verificaCarregamentoDados();
                                    }
                                },1000);
                            })();
                        }
                    });
                }else{
                    carregaDadosRegistro();
                }
            },100);
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
        dlg.result.then(function(btn){
             $scope.confirmSalvar();
        },function(btn){
                
        });  
    };
    
    
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
    
    /*
     * Reseta o form após um envio
     * @returns {undefined}
     */
    var _limpaForm = function(){
        document.getElementsByName("arquivoEditavel")[0].value = null;
        document.getElementsByName("arquivoImpressao")[0].value = null;
        document.getElementsByName("arquivoPdf")[0].value = null;
        var auxEmp = $scope.registro.empreendimento;
        var auxUsr = $scope.registro.usuario;
        $scope.buttons = {};
        $scope.registro = {};
        $scope.registro.empreendimento = auxEmp;
        $scope.registro.usuario = auxUsr;
        $scope.params.complemento = null;
        $scope.formListaMestra.$setPristine();   
    };
    
    
    /**
     * Função executada quando o usuário confirma o envio do formulário
     * @returns {undefined}
     */
    $scope.confirmSalvar = function(){
        
        // Inicializa o progresso da operação salvar 
        var _progress = 5;
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
        $scope.registro.servidorTerra = $scope.buttons.ServidorTerra ? "SIM":"NÃO";
        $scope.registro.pastaFisicaCliente = $scope.buttons.PastaFisicaCliente ? "SIM":"NÃO";
        $scope.registro.pastaFisicaTerra = $scope.buttons.PastaFisicaTerra ? "SIM":"NÃO";
        
        // Faz o tratamento da informação Blocos
        var auxBlocos = "";
        for(var i in $scope.registro.blocos){
           auxBlocos += $scope.registro.blocos[i] ? i+" ": "";
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
        
        // Busca pelas configurações dos níveis de gestão
        $scope.registro.codigoDoEntregavel = $scope.registro.projeto+($scope.registro.complemento ? " "+$scope.registro.complemento : "");
        $scope.registro.localizacaoNoSistema = "";
        for(var i = 0; i < $scope.params.configArquivos.length; i++){
            if($scope.params.configArquivos[i].entregaveis === $scope.registro.codigoDoEntregavel){
                $scope.registro.localizacaoNoSistema = $scope.params.configArquivos[i].localizacaoNoSistema.replace(/{%EMP%}/g, $scope.registro.empreendimento);
                $scope.registro.etapasTerra = $scope.params.configArquivos[i].etapasTerra;
                $scope.registro.tipoProjeto = $scope.params.configArquivos[i].tipoProjeto;
                $scope.registro.codigoEtapa = $scope.params.configArquivos[i].codigoEtapa;
                $scope.registro.descricaoNivel1 = $scope.params.configArquivos[i].descricaoNivel1;
                $scope.registro.descricaoNivel2 = $scope.params.configArquivos[i].descricaoNivel2;
                $scope.registro.descricaoNivel3 = $scope.params.configArquivos[i].descricaoNivel3;
                $scope.registro.descricaoNivel4 = $scope.params.configArquivos[i].descricaoNivel4;
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
        $scope.registro.nomeDocumento = $scope.registro.cliente;
        $scope.registro.nomeDocumento += " "+$scope.registro.empreendimento;
        $scope.registro.nomeDocumento += " "+$scope.registro.projeto;
        $scope.registro.nomeDocumento += $scope.registro.complemento? " "+$scope.registro.complemento : "";
        $scope.registro.nomeDocumento += $scope.registro.nGrupoPranchas? " "+$scope.registro.nGrupoPranchas : "";
        $scope.registro.nomeDocumento += $scope.registro.blocos? " BLOCOS "+$scope.registro.blocos : "";
        $scope.registro.nomeDocumento += $scope.registro.numeroPrancha? " "+$scope.registro.numeroPrancha : "";
        $scope.registro.nomeDocumento += " "+$scope.registro.descricaoArquivo;
         
        // Formata a data
        $scope.registro.dataDocumento = $filter('date')($scope.registro.dataDocumento,'yyyy-MM-dd');
        
        successSalvarDados = function(data, status, message){
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
                            _limpaForm();
                        }else{
                            dialogs.error("Erro",message);
                        }  
                    }else{
                       verificaTermino();
                    }   
                },1000);   
            })();
        };
        
        
        /*
         * Inicia a gravação dos dados na planilha do Google
         */        
        gravaDadosPlanilha = function(){
            // Seta o ID da planilha e nome da página a serem gravados os dados
            googleSheet.setSpreadSheetId(idPlanilha);
            googleSheet.setSheetName('Índice Projetos');
            _progressMessage = "Gravando dados na planilha...";
            
            // Verifica se o registro possui um código. Se for false quer dizer que é um registro novo,
            // caso contratio trata-se de uma atualização de um registro 
            if(!$scope.registro.codigo){
                // Inicia a revisão do arquivo em 1;
                $scope.registro.revisao = 1;
                // Insere um novo registro na planilha
                googleSheet.insertRecord($scope.registro,successSalvarDados);
            }else{
                // Remove as informaçõe que são calculadas automaticamente por formulas na planilha
                delete $scope.registro.linha;
                delete $scope.registro.editar;
                // Incremente a revisão do arquivo;
                $scope.registro.revisao++;
                // Atualiza um registro na planilha
                googleSheet.updateRecord($scope.registro,"Código",$scope.registro.codigo,successSalvarDados);
            }
        };
        
        
        // Iniciar a verificação de arquivos para upload
        (uploadFile = function(){
            if(arrayArquivos.length > 0){
                _progressMessage = "Gravando "+arrayArquivos[0].description+"...";
                if(typeof(arrayArquivos[0].file) === "object"){
                    // Seta as configurações necessárias para enviar os arquivos para o Drive
                    lmFiles.setFolderRaiz($scope.params.idPastaRaiz);
                    lmFiles.setPatchFolder($scope.registro.localizacaoNoSistema);
                    lmFiles.setFile(arrayArquivos[0].file,$scope.registro.nomeDocumento);
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
        
        
    };
    
    $scope.teste = function(){
       console.log($scope.registro.blocos);
    };
    
    $scope.teste2 = function(){
    
    };

  });