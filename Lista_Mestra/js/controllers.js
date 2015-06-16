/*
 * Controller do formulário Lista Mestra.
 * 
 * @param {object} $rootScope Escopo Raiz da aplicação
 * @param {object} $scope Escopo do controles do controller 
 * @param {object} $filter Objeto para trabalhar com filtros 
 * @param {object} $timeout Objeto para manipula delays de execução
 * @param {object} mtlGdrive Objeto para manipulação de arquivos do Google Drive
 * @param {object} googleSheet Objeto para manipulação de dados de uma planilha do google
 * @param {object} dialogs Objeto para exibição de mensagens de dialogo
 * @param {object} lmFiles objeto responsáveis por manipular os arquivos do formulário
 * @param {object} util Objeto com funções utilitárias
 * @param {object} acessos Permite a validação do acesso dos usuários
 * @param {object} config Variáries globais de configuração da aplicação
 * @param {object} configAcessos variáveis globais de configuração da API Acessos
 */
app.controller('formListaMestra',function($rootScope,$scope,$filter,$timeout,mtlGdrive,googleSheet,dialogs,lmFiles,util,acessos,configAcessos,config){
             
    // Inicializa os objetos utilizados pelo formulário
    $scope.registro = new Object();
    $scope.params = new Object();
    $scope.buttons = new Object();
        
    $scope.registro.empreendimento = util.QueryString.empreendimento;
    $scope.registro.codigo = util.QueryString.codigo;
    $scope.edicao = $scope.registro.codigo ? true : false;
    
    // Seta os parâmetros utilizados pela API do Google Drive
    // e checa a autenticação do usuário
    mtlGdrive.setClientId(config.googleDriveClienteId);
    mtlGdrive.setScopes(config.googleDriveScope);
    mtlGdrive.checkAuth();
        
    // Mostra o Loading na página
    $scope.messageLoading = "Autenticando usuário...";
    $scope.spinerloading = true;
    
    // Seta parâmetros utilizados pela API do Apps Script
    googleSheet.setSpreadSheetId(config.idSheetConfig);
    
    // Carrega as configurações dos empreendimentos
    googleSheet.setSheetName(config.sheetConfigEmp);
    googleSheet.getColumnData(['cliente','empreendimento','idPlanilha','idPastaRaiz','idPastaBackup','emailGrupo','nomePagina'],'associativeArray',function(data, status, message){
        $scope.params.configEmpreendimentos = status ? data : showError(message);
        for(var i in data){
            if($scope.registro.empreendimento === $scope.params.configEmpreendimentos[i].empreendimento){
                angular.forEach(data[i],function(val, key){
                   $scope.params[key] = val;
                });
                break;
            }
        }
        $scope.registro.cliente = $scope.params.cliente;
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
                $scope.params.usuario = data;
                $scope.params.acesso = true;
                carregaParamsForm();
            }else if(!status && data){
                $scope.registro.usuario = data;
                $scope.params.usuario = data;
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
     * Inicializa o carregamento dos parâmetros necessários para o funcionamento do formulário 
     * ************************************************************************************************
     **/
    
    carregaParamsForm = function(){
        
        googleSheet.setSheetName(config.sheetParamsForm);

        // Carrega o select Projeto
        googleSheet.getColumnData(["projeto"],"array",function(data, status, message){
            $scope.params.projeto = status ? data : showError(message);
        });

        // Carrega o select Responsável Técnico
        googleSheet.getColumnData(['responsavelTecnico','responsavelTecnicoEmpreendimento'],"associativeArray",function(data, status, message){
            if(status){
                $scope.params.responsavelTecnico = [];
                angular.forEach(data,function(object){
                    if(object.responsavelTecnicoEmpreendimento === $scope.registro.empreendimento)
                        $scope.params.responsavelTecnico.push(object.responsavelTecnico); 
                });
            }else{
                showError(message);
            }
        });
        
        /*
         * Adiciona elementos ao select detalhamento 
         * @param {string} detalhamento detalhamento a ser selecionado automaticamente (Opcional)
         * @returns {undefined}
         */
        $scope.showDetalhamentos = function(detalhamento){
           googleSheet.setSpreadSheetId(config.idSheetConfig);
           googleSheet.setSheetName(config.sheetParamsForm);
           $scope.params.detalhamento = null;
           $scope.registro.detalhamento = "";
           googleSheet.getColumnData(['complementoDetalhamento','detalhamento'],'associativeArray',function(data, status, message){
               if(status){
                   $scope.params.detalhamento = [];
                   angular.forEach(data,function(object){
                      if(object.complementoDetalhamento === $scope.registro.complemento)
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
        googleSheet.setSheetName(config.sheetParamsFiles);
        googleSheet.getColumnData(['entregaveis','localizacaoNoSistema','codigoEtapa','etapaFinalCronograma'],'associativeArray',function(data, status, message){
            $scope.params.configArquivos = status ? data : showError(message);
        });

        // Exibe os Blocos dos empreendimentos
        $scope.params.bloco = null;
        googleSheet.setSheetName(config.sheetParamsForm);
        if($scope.registro.empreendimento)
            googleSheet.getColumnData(['blocos','blocosEmpreendimento'],'associativeArray',function(data, status, message){
                if(status){
                    $scope.params.blocos = [];
                    angular.forEach(data,function(object){
                        if(object.blocosEmpreendimento === $scope.registro.empreendimento)
                        $scope.params.blocos.push(object.blocos); 
                    });
                }else{
                    showError(message);
                }
            });
        
        /*
        * Adiciona elementos ao input complemento
        * @param {string} complemento complemento a ser selecionado automaticamente (Opcional)
        * @param {string} detalhamento detalhamento a ser selecionado automaticamente (Opcional)
        */
       $scope.showComplementos = function(complemento,detalhamento){
           googleSheet.setSpreadSheetId(config.idSheetConfig);
           googleSheet.setSheetName(config.sheetParamsForm);
           $scope.params.complemento = null;
           $scope.registro.complemento = "";
           googleSheet.getColumnData(['projetoComplemento','complemento'],'associativeArray',function(data, status, message){
               if(status){
                   $scope.params.complemento = [];
                   angular.forEach(data,function(object){
                      if(object.projetoComplemento === $scope.registro.projeto)
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
       // Verifica se o formulário foi carregado para edição de um registro
       if($scope.edicao)
            carregaDadosRegistro();
    };
    /**
     * ************************************************************************************************
     * FIM Carregamento dos parâmetros
     **/


    /*
     * Carrega o formulário com os dados de um registro salvo na planilha
     */
    carregaDadosRegistro = function(){
        $scope.messageLoading = "Carregando dados...";
        googleSheet.setSpreadSheetId($scope.params.idPlanilha);
        googleSheet.setSheetName($scope.params.nomePagina);
            $timeout(function(){
                // Verifica se todos os parâmetros básicos foram carregados
                if($scope.params.cliente && $scope.params.projeto && $scope.params.responsavelTecnico && $scope.params.blocos){
                    googleSheet.getRecord("Código",$scope.registro.codigo,function(data,status,message){
                        
                        if(!status)
                            return showError(message);
                       
                        $scope.registroAntigo = (JSON.parse(JSON.stringify(data)));
                        
                        // Carrega os dados no objeto registro
                        $scope.registro = data;

                        // Altera o e-mail para o usuário logado.
                        $scope.registro.usuario = $scope.params.usuario;

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
                        
                        // Manipula as informações sobre os arquivos
                        $scope.params.arquivoEditavel = $scope.registro.arquivoEditavel;
                        $scope.params.arquivoImpressao = $scope.registro.arquivoImpressao;
                        $scope.params.arquivoPdf = $scope.registro.arquivoPdf;
                        $scope.params.comprovantePagamento = $scope.registro.comprovantePagamento;
                        $scope.registro.arquivoEditavel = null;
                        $scope.registro.arquivoImpressao = null;
                        $scope.registro.arquivoPdf = null;
                        $scope.registro.comprovantePagamento = null;
                        
                        // Limpa campo observações
                        $scope.registro.observacoes = "";
                        
                        // Verifica se não precisa carregar os inputs  complemento e detalhamento
                        if(!$scope.registro.complemento && !$scope.registro.detalhamento){
                            $scope.spinerloading = false;
                        }else{
                            // Popula os selects complemento e detalhamento se ouver
                            var _auxComplemento = $scope.registro.complemento;
                            var _auxDetalhamento = $scope.registro.detalhamento;
                            $scope.showComplementos($scope.registro.complemento,$scope.registro.detalhamento);
                            
                            // Looping que verifica se os campos complemento e detalhamento foram carregados com sucesso
                            (function verificaCarregamentoDados(){
                                $timeout(function(){
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
     * FIM Carregamento dados de um registro salvo na planilha
     **/
    
    /**
     * Função executada quando o formulário é submetido
     * @returns {undefined}
     */
    $scope.salvar = function(){
        var message = "",
            titulo = "Atenção!";
        if($scope.edicao){
            message += $scope.params.arquivoEditavel && !$scope.registro.arquivoEditavel ? "Você irá manter o arquivo editável!<br/>" :"";
            message += $scope.params.arquivoImpressao && !$scope.registro.arquivoImpressao ? "Você irá manter o arquivo de impressão!<br/>" :"";
            message += $scope.params.arquivoPdf && !$scope.registro.arquivoPdf ? "Você irá manter o arquivo Pdf!<br/>" :"";
            message += $scope.params.comprovantePagamento && !$scope.registro.comprovantePagamento ? "Você irá manter o arquivo comprovante de pagamento!<br/>" :"";
            message += "<br/>Deseja realmente atualizar o registro?";
        }else{
            message += "Deseja realmente gravar o registro ?";
        }
        var dlg = dialogs.confirm(titulo,message);
        dlg.result.then(function(btn){
             $scope.confirmSalvar();
        },function(btn){
                
        });  
    };
    
    
    /**
     * Função padrão para mensagem de erro
     * @param {string} message Texto adicional para ser exibido na mensagem de erro
     * @returns {Boolean}
     */
    var showError = function(message){
        $scope.spinerloading = false;
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
     * Limpa o form após um envio
     * @returns {undefined}
     */
    var _limpaForm = function(){
        document.getElementsByName("arquivoEditavel")[0].value = null;
        document.getElementsByName("arquivoImpressao")[0].value = null;
        document.getElementsByName("arquivoPdf")[0].value = null;
        document.getElementsByName("comprovantePagamento")[0].value = null;
        var auxEmp = $scope.registro.empreendimento,
            auxUsr = $scope.registro.usuario;
        $scope.buttons = {};
        $scope.registro = {};
        $scope.registro.empreendimento = auxEmp;
        $scope.registro.usuario = auxUsr;
        $scope.registro.cliente = $scope.params.cliente;
        $scope.params.complemento = null;
        $scope.formListaMestra.$setPristine();   
    };
    
    
    /**
     * Função executada quando o usuário confirma o envio do formulário
     */
    $scope.confirmSalvar = function(){
        
        /*
         * Função executada assim que os dados são gravados com sucesso 
         * @param {object} data dados de retorno da api Google Sheet
         * @param {boolean} status status da transação
         * @param {string} message Mensagem de retorno
         * @returns {undefined}
         */
        successSalvarDados = function(data, status, message){
            $scope.spinerloading = false;
            // Verifica o status retornado pelo request
            if(status){
                var dlg = dialogs.notify("Status",message);
                dlg.result.then(function(){
                    if($scope.registro.codigo)
                        window.close(); 
                     _limpaForm();
                });
            }else{
                dialogs.error("Erro",message);
            }  
        };
        
        /*
         * Verifica se o arquivo recem gravado faz parte de um grupo de pranchas
         * @param {int} data Linha do registro salvo ou atualizado na planilha
         * @param {boolean} status Status da transação
         * @param {string} message Mensagem de retorno 
         */
        verificaGrupoPranchas = function(data, status, message){
            var linhaRegAtual = data.linha;
            if(status && $scope.registro.nGrupoPranchas){
                $scope.messageLoading = "Verificando grupo de pranchas...";
                googleSheet.getAllRecords("associativeArray",function(data, status, message2){
                    if(!status)
                        return showError(message2);
                    
                    var regParaAtualizar = [], 
                        arrFilesBackup = [];
                    angular.forEach(data,function(reg){
                        if(reg.nGrupoPranchas === $scope.registro.nGrupoPranchas && reg.linha !== linhaRegAtual){
                            regParaAtualizar.push(reg);
                            arrFilesBackup.push(reg.arquivoEditavel);
                        }
                    });
                    
                    if(regParaAtualizar.length > 0){
                        $scope.messageLoading = "Efetuando backup dos arquivos antigos...";
                        lmFiles.makeBackupFiles(arrFilesBackup,$scope.params.idPastaBackup,function(status,data,message2){
                            if(!status)
                                return showError(message2);
                            atualizaLinkEditavel(regParaAtualizar,message);
                        });
                        
                    }else{
                        successSalvarDados(data, status, message);
                    }
                });
            }else{
                successSalvarDados(data, status, message);
            }
            
            /*
             * Atualiza todos os links editáveis de um grupo de pranchas
             * @param {array} regParaAtualizar Array com os registros a serem atualizados
             */
            atualizaLinkEditavel = function(regParaAtualizar,message){
                $scope.messageLoading = "Atualizando links do grupo de pranchas...";
                regParaAtualizar[0].revisao++;
                regParaAtualizar[0].arquivoEditavel = $scope.registro.arquivoEditavel;
                regParaAtualizar[0].dataDocumento = $filter('date')(new Date(regParaAtualizar[0].dataDocumento),'yyyy-MM-dd');
                var linha = regParaAtualizar[0].linha;
                delete(regParaAtualizar[0].linha);
                delete(regParaAtualizar[0].adicionar);
                googleSheet.updateRecord(regParaAtualizar[0],"linha",linha,"Histórico Revisões",function(data, status, message2){
                    if(!status)
                        return showError(message2);

                    regParaAtualizar.shift();
                    if(regParaAtualizar.length>0){
                        atualizaLinkEditavel(regParaAtualizar,message);
                    }else{
                        successSalvarDados(data, status, message);
                    }
                });
            };
        };
                              
        /*
         * Inicia a gravação dos dados na planilha do Google
         */        
        gravaDadosPlanilha = function(){
            // Seta o ID da planilha e nome da página a serem gravados os dados
            googleSheet.setSpreadSheetId($scope.params.idPlanilha);
            googleSheet.setSheetName(config.nameSheetListaMestra);
            
            // Verifica se o formulário não foi carregado para edição de um registro
            if(!$scope.edicao){
                $scope.messageLoading = "Gravando dados na planilha..";
                
                // Inicia a revisão do arquivo em 1;
                $scope.registro.revisao = 1;
                
                // Insere um novo registro na planilha
                googleSheet.insertRecord($scope.registro,verificaGrupoPranchas);
            }else{
                $scope.messageLoading = "Atualizando dados na planilha..";

//                if($scope.registro.nGrupoPranchas !== $scope.registroAntigo.nGrupoPranchas ||
//                $scope.registro.projeto !== $scope.registroAntigo.projeto ||
//                $scope.registro.complemento !== $scope.registroAntigo.complemento ||
//                $scope.registro.blocos !== $scope.registroAntigo.blocos){
//                    log("Nome do arquivo deve ser alterado");
//                    log(arrayArquivos);
//                    log($scope.registro.nomeDocumento);
//                    var arryFilesRename = [];
////                    angular.forEach(arrayArquivos,function(arquivo){
////                        arryFilesRename.push(arquivo.file);
////                    });
////                    lmFiles.updateNameFiles([],"AUSHUAHSUHAUSHAUS.jpg",function(status,data,message){;
////                        log(status);    
////                        log(data);    
////                        log(message);    
////                    });
//                    
//                }
                
                // Remove as informaçõe que são geradas automaticamente por formulas na planilha
                delete $scope.registro.linha;
                delete $scope.registro.adicionar;

                // Incremente a revisão do arquivo;
                $scope.registro.revisao++;

                // Atualiza um registro na planilha
                googleSheet.updateRecord($scope.registro,"Código",$scope.registro.codigo,'Histórico Revisões',verificaGrupoPranchas);  
            }
        };
        
        // Iniciar a verificação de arquivos para upload
        uploadFile = function(arrayArquivos){
            if(arrayArquivos.length > 0){
                if(typeof(arrayArquivos[0].file) === "object" && arrayArquivos[0].file ){
                    $scope.messageLoading = "Gravando "+arrayArquivos[0].description+"...";
                    // Seta as configurações necessárias para enviar os arquivos para o Drive
                    lmFiles.setFolderRaiz($scope.params.idPastaRaiz);
                    lmFiles.setPatchFolder($scope.registro.localizacaoNoSistema);
                    lmFiles.setFile(arrayArquivos[0].file,$scope.registro.nomeDocumento);
                    // Iniciar o upload do arquivo
                    lmFiles.uploadFile(function(status,data,message){
                        if(!status)
                            return showError(message);
                        $scope.registro[arrayArquivos[0].id] = data;
                        arrayArquivos.shift();
                        uploadFile(arrayArquivos);
                    });
                }else{
                    arrayArquivos.shift();
                    uploadFile(arrayArquivos);
                }   
            }else{
                gravaDadosPlanilha();
            }
        };
        
        // Inicializa o progresso da operação salvar 
        $scope.messageLoading = "Processando...";
        $scope.spinerloading = true;
        
        // Formata a data
        $scope.registro.dataDocumento = $filter('date')($scope.registro.dataDocumento,'yyyy-MM-dd');
        
        // Faz o tratamento das indicações das pastas físicas
        $scope.registro.servidorTerra = $scope.buttons.ServidorTerra ? "SIM":"NÃO";
        $scope.registro.pastaFisicaCliente = $scope.buttons.PastaFisicaCliente ? "SIM":"NÃO";
        $scope.registro.pastaFisicaTerra = $scope.buttons.PastaFisicaTerra ? "SIM":"NÃO";
                
        // Faz o tratamento dos Blocos
        var auxBlocos = "",
            keys = $scope.registro.blocos? Object.keys($scope.registro.blocos).sort() : "";
        for(var i in keys){auxBlocos += $scope.registro.blocos[keys[i]] ? keys[i]+" ": "";}
        $scope.registro.blocos = auxBlocos.substring(0, auxBlocos.length -1);
        
        // Faz o tratamento da informação Detalhamento
        if($scope.registro.detalhamento === 'OUTRO')
            $scope.registro.detalhamento = $scope.registro.outroDetalhamento;
        delete $scope.registro.outroDetalhamento;
        
        // Busca pelas configurações dos níveis de gestão
        $scope.registro.codigoDoEntregavel = $scope.registro.projeto+($scope.registro.complemento ? " "+$scope.registro.complemento : "");
        $scope.registro.localizacaoNoSistema = "";
        for(var i = 0; i < $scope.params.configArquivos.length; i++){
            if($scope.params.configArquivos[i].entregaveis === $scope.registro.codigoDoEntregavel){
                $scope.registro.localizacaoNoSistema = $scope.params.configArquivos[i].localizacaoNoSistema.replace(/{%EMP%}/g, $scope.registro.empreendimento);
                $scope.registro.codigoEtapa = $scope.params.configArquivos[i].codigoEtapa;
                $scope.registro.etapaFinalCronograma = $scope.params.configArquivos[i].etapaFinalCronograma;
                break;
            }
        }
        
        // Monta o nome do arquivo
        $scope.registro.nomeDocumento = $scope.registro.cliente;
        $scope.registro.nomeDocumento += " "+$scope.registro.empreendimento;
        $scope.registro.nomeDocumento += " "+$scope.registro.projeto;
        $scope.registro.nomeDocumento += $scope.registro.complemento? " "+$scope.registro.complemento : "";
        $scope.registro.nomeDocumento += $scope.registro.nGrupoPranchas? " "+$scope.registro.nGrupoPranchas : "";
        $scope.registro.nomeDocumento += $scope.registro.blocos? " BLOCOS "+$scope.registro.blocos : "";
        $scope.registro.nomeDocumento += $scope.registro.numeroPrancha? " "+$scope.registro.numeroPrancha : "";
        
        // A partir daqui faz manipulação dos arquivos para enviar para o Google Drive e backup dos arquivos antigos
        // se houver.
        var auxArquivoEditavel = $scope.registro.arquivoEditavel,
            auxArquivoImpressao = $scope.registro.arquivoImpressao,
            auxArquivoPdf = $scope.registro.arquivoPdf;
    
        var arrFilesBackup= [];       
        var arrayArquivos = 
            [{id : "arquivoEditavel",description:"Arquivo Editável", file: null},
            {id : "arquivoImpressao",description:"Arquivo Impressão", file: null},
            {id : "arquivoPdf",description:"Arquivo Pdf", file: null},
            {id : "comprovantePagamento",description:"Comprovante Pagamento", file:null}];
        
        angular.forEach(arrayArquivos,function(arquivo){
           if(!$scope.registro[arquivo.id]){
               $scope.registro[arquivo.id] = $scope.params[arquivo.id];
           }else if($scope.params[arquivo.id]){
               arrFilesBackup.push($scope.params[arquivo.id]);
           }
           arquivo.file = $scope.registro[arquivo.id];
        });
                
        if(arrFilesBackup.length > 0){
            $scope.messageLoading = "Efetuando backup dos arquivos antigos...";
            lmFiles.makeBackupFiles(arrFilesBackup,$scope.params.idPastaBackup,function(status,data,message){
                if(!status)
                    return showError(message);
                uploadFile(arrayArquivos.slice(0));
            }); 
        }else{
           uploadFile(arrayArquivos.slice(0)); 
        }                                 
    };
    /**
    * ************************************************************************************************
    * FIM Salvar Dados
    **/ 
    
    $scope.teste = function(){
        
        var object = {
            observacoes : "Bla bla bla bla",
            detalhamento : "Ble Ble ble ble..."
        };
        googleSheet.setSpreadSheetId("1ZBHukrngNqO6mS-iEn_Ca4T-t8ck-Q2-rUyieR7ZTXQ");
        googleSheet.setSheetName(config.nameSheetListaMestra);
        googleSheet.updateRecords(object,"Código","193",null,function(data, status, message){
            console.log(data);
            console.log(status);
            console.log(message);
        });
    };
    
    $scope.teste2 = function(){    
        lmFiles.updateNameFiles(['0B7C12ldJ-VYWU0dpZS03Tnduc1E','0B7C12ldJ-VYWVzVEYndqMFJrUzg'],"Lol :)",function(status,data,message){
            log(status);    
            log(data);    
            log(message);    
        });
    };
  });