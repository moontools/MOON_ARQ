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
 * @param {object} lmNotificacao Objeto para notificações da Lista Mestra
 * @param {object} util Objeto com funções utilitárias
 * @param {object} acessos Permite a validação do acesso dos usuários
 * @param {object} config Variáries globais de configuração da aplicação
 * @param {object} configAcessos variáveis globais de configuração da API Acessos
 */
app.controller('formListaMestra',function($rootScope,$scope,$filter,$timeout,$http,mtlGdrive,googleSheet,dialogs,lmFiles,lmNotificacao,util,acessos,configAcessos,config){
    
    /**
     * Função padrão para mensagem de erro
     * @param {string} message Texto adicional para ser exibido na mensagem de erro
     * @returns {Boolean}
     */
    showError = function(message){
        log(message);
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
     * Carega os parâmetros iniciais necessário para o funcionamento do formulário.
     */
    carregaParametrosIniciais = function(){
        $scope.spinerloading = true;
        // Seta parâmetros utilizados pela API do Apps Script
        googleSheet.setSpreadSheetId(config.idSheetConfig);
        googleSheet.setSheetName(config.sheetConfigEmp);
        log("Buscando configurações dos empreendimentos...");
        $scope.messageLoading = "Carregando parâmetros iniciais...";
        // Carrega as configurações dos empreendimentos
        googleSheet.getColumnData(['cliente','empreendimento','idPlanilha','idPastaRaiz','idPastaBackup','emailGrupoAcesso','emailGrupoNotificacao','nomePagina'],'associativeArray',function(data, status, message){
            $scope.params.configEmpreendimentos = status ? data : showError(message);
            log("-> Resgatadas configurações dos empreendimentos!");
            for(var i in data){
                if($scope.registro.empreendimento === $scope.params.configEmpreendimentos[i].empreendimento){
                    angular.forEach(data[i],function(val, key){
                       $scope.params[key] = val;
                    });
                    break;
                }
            }
            $scope.registro.cliente = $scope.params.cliente;
            if(!$scope.params.emailGrupoAcesso){
                $scope.spinerloading = false;
                return showError("Empreendimento inválido!");
            }
            verificaAcesso($scope.params.emailGrupoAcesso);
        });
    };
    
    /*
     * Verifica se o usuário pode acessar o formulário
     * @param {string} emailGrupoAcesso email do grupo a ser consultado
     */
    verificaAcesso = function(emailGrupoAcesso){
        // Mostra o Loading na página
        $scope.messageLoading = "Autenticando usuário...";
        log("Verificando acesso do usuário...");
        acessos.getAccessByGroup(emailGrupoAcesso,function(data, status, message){
            log("-> Acesso verificado!");
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
                $scope.spinerloading = false;
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
            if(!$scope.acao === "NEW")
                $scope.spinerloading = false;
            
        });
    };
      
    /**
     * Inicializa o carregamento dos parâmetros necessários para o funcionamento do formulário 
     * ************************************************************************************************
     **/
    
    carregaParamsForm = function(){
        log("Carregando parâmetros do formulário...");
        googleSheet.setSheetName(config.sheetParamsForm);

        // Carrega o select Categoria
        googleSheet.getColumnData(["categoria"],"array",function(data, status, message){
            $scope.params.categoria = status ? data : showError(message);
        });
        
        googleSheet.setSheetName(config.sheetParamsFiles);
        // Carrega o select Responsável Técnico
        googleSheet.getColumnData(['responsavelTecnico','responsavelTecnicoEmpreendimento'],"associativeArray",function(data, status, message){
            if(status){
                $scope.params.responsavelTecnico = [];
                angular.forEach(data,function(object){
                    if(object.responsavelTecnicoEmpreendimento === $scope.registro.empreendimento)
                        $scope.params.responsavelTecnico.push(object.responsavelTecnico); 
                });
                log("-> Parâmetros carregados com sucesso!");
                // Verifica se o formulário foi carregado para edição de um registro
                if($scope.acao === "UPDATE" || $scope.acao === "ADDPRANCHA"){
                    carregaDadosRegistro();
                    log("Carregando dados do registro de código: "+$scope.registro.codigo+"...");
                }else{
                    $scope.spinerloading = false;
                }
                
            }else{
                showError(message);
            }
        });
        
        /*
         * Adiciona elementos ao select descricao 
         * @param {string} descricao descricao a ser selecionado automaticamente (Opcional)
         * @returns {undefined}
         */
        $scope.showDescricao = function(descricao){
           googleSheet.setSpreadSheetId(config.idSheetConfig);
           googleSheet.setSheetName(config.sheetParamsForm);
           $scope.params.descricao = null;
           $scope.registro.descricao = "";
           googleSheet.getColumnData(['arquivoDescricao','descricao'],'associativeArray',function(data, status, message){
               if(status){
                   $scope.params.descricao = [];
                   angular.forEach(data,function(object){
                      if(object.arquivoDescricao === $scope.registro.arquivo)
                      $scope.params.descricao.push(object.descricao); 
                   });
                   if(descricao && $scope.params.descricao.indexOf(descricao) < 0){
                       $scope.registro.descricao = 'OUTRO';
                       $scope.registro.outraDescricaoArquivo = descricao;
                   }else if(descricao){
                       $scope.registro.descricao = descricao;
                   }
               }else{
                   showError(message);
               }
           });
        };

        // Carrega as configurações de localização de arquivos
        googleSheet.setSheetName(config.sheetParamsFiles);
        googleSheet.getColumnData(['entregaveis','dataNomeArquivo','localizacaoNoSistema','codigoEtapa','etapaFinalCronograma'],'associativeArray',function(data, status, message){
            $scope.params.configArquivos = status ? data : showError(message);
        });

        // Exibe os Blocos dos empreendimentos
        $scope.params.bloco = null;
        googleSheet.setSheetName(config.sheetParamsFiles);
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
        * Adiciona elementos ao input arquivo
        * @param {string} arquivo arquivo a ser selecionado automaticamente (Opcional)
        * @param {string} descricao descricao a ser selecionado automaticamente (Opcional)
        */
       $scope.showArquivos = function(arquivo,descricao){
           googleSheet.setSpreadSheetId(config.idSheetConfig);
           googleSheet.setSheetName(config.sheetParamsForm);
           $scope.params.arquivo = null;
           $scope.registro.arquivo = "";
           googleSheet.getColumnData(['categoriaArquivo','arquivo'],'associativeArray',function(data, status, message){
               if(status){
                   $scope.params.arquivo = [];
                   angular.forEach(data,function(object){
                      if(object.categoriaArquivo === $scope.registro.categoria)
                      $scope.params.arquivo.push(object.arquivo); 
                   });
                   $scope.registro.arquivo = arquivo ? arquivo : "";
                   if(descricao)
                        $scope.showDescricao(descricao); 
               }else{
                   showError(message);
               }
           });
       };
    };
    /**
     * ************************************************************************************************
     * FIM Carregamento dos parâmetros
     **/
    
    /*
     * Executa alterações no formulário necessárias para uma atualização
     */
    preparaFormUpdate = function(){
        // Manipula as informações sobre os arquivos
        $scope.params.arquivoEditavel = $scope.registro.arquivoEditavel;
        $scope.params.arquivoImpressao = $scope.registro.arquivoImpressao;
        $scope.params.arquivoPdf = $scope.registro.arquivoPdf;
        $scope.params.comprovantePagamento = $scope.registro.comprovantePagamento;
        $scope.registro.arquivoEditavel = null;
        $scope.registro.arquivoImpressao = null;
        $scope.registro.arquivoPdf = null;
        $scope.registro.comprovantePagamento = null;
    };
    
    /*
     * xecuta alterações no formulário necessárias para adição de uma prancha
     */
    preparaFormAddPrancha = function(){
        log($scope.registro);
        $scope.registro.numeroPrancha = "";
        $scope.registro.codigo = "";
        $scope.registro.descricao = "";
        $scope.registro.valorPagamento = "";
        $scope.params.arquivoEditavel = $scope.registro.arquivoEditavel;
        $scope.registro.arquivoEditavel = null;
        $scope.registro.arquivoImpressao = null;
        $scope.registro.arquivoPdf = null;
        $scope.registro.comprovantePagamento = null;
        log($scope.registro);
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
                if($scope.params.cliente && $scope.params.categoria && $scope.params.responsavelTecnico && $scope.params.blocos){
                    googleSheet.getRecord("Código",$scope.registro.codigo,function(data,status,message){
                        if(!status)
                            return showError(message);
                        log("-> Dados do registro carregados!");
                        $scope.registroAntigo = (JSON.parse(JSON.stringify(data)));
                        
                        // Carrega os dados no objeto registro
                        $scope.registro = data;

                        // Altera o e-mail para o usuário logado.
                        $scope.registro.usuario = $scope.params.usuario;

                        // Converte a string em data
                        $scope.registro.dataDocumento = new Date($scope.registro.dataDocumento);
                                                
                        // Ativa os botões toggle Switch que indicam a localização dos arquivos físicos
                        $scope.buttons.ServidorTerra = $scope.registro.servidorTerra === "SIM" ? true : false;
                        $scope.buttons.PastaFisicaCliente = $scope.registro.pastaFisicaCliente === "SIM" ? true : false;
                        $scope.buttons.PastaFisicaTerra = $scope.registro.pastaFisicaTerra === "SIM" ? true : false;
                        
                        // Ativa os checkbox dos blocos
                        var auxBlocos = $scope.registro.blocos.split(" ");
                        $scope.registro.blocos = {};
                        for(var i in auxBlocos){
                            $scope.registro.blocos[auxBlocos[i]] = true;
                        }        
                        
                        // Limpa campo observações
                        $scope.registro.observacoes = "";
                        
                        // Verifica se não precisa carregar os inputs  arquivo e descricao
                        if(!$scope.registro.arquivo && !$scope.registro.descricao){
                            $scope.spinerloading = false;
                        }else{
                            // Popula os selects arquivo e descricao se ouver
                            var _auxArquivo = $scope.registro.arquivo;
                            var _auxDetalhamento = $scope.registro.descricao;
                            $scope.showArquivos($scope.registro.arquivo,$scope.registro.descricao);
                            
                            // Looping que verifica se os campos arquivo e descricao foram carregados com sucesso
                            (function verificaCarregamentoDados(){
                                $timeout(function(){
                                    if($scope.registro.arquivo && ((_auxDetalhamento && $scope.registro.descricao) || (!_auxDetalhamento))){
                                        $scope.spinerloading = false;
                                        if($scope.acao === "UPDATE"){
                                            preparaFormUpdate();
                                        }else{
                                            preparaFormAddPrancha();
                                        }
                                        
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
     * Função executada quando o botão submit do formulário é pressionado
     */
    $scope.salvar = function(){
        var message = "",
            titulo = "Atenção!";
        if($scope.acao === "UPDATE"){
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
     * Força atualização da mensagem de loading
     * @param {string} message Mesagem a ser exibida
     */
    $scope.updateMessageloading = function(message){
        $scope.messageLoading = message;
        $scope.$apply();
    };
    
    /*
     * Remove um arquivo da Lista Mestra
     */
    $scope.removeFile = function(file){
        dialogs.confirm("Atenção","Deseja realmente remover o arquivo?")
        .result.then(function(btn){
            $scope.arrayFilesBackup.push($scope.params[file]);
            $scope.params[file] = "";
        },function(btn){
                
        }); 
    };
    
    /*
     * Limpa o form após um envio
     * @returns {undefined}
     */
     _limpaForm = function(){
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
        $scope.params.arquivo = null;
        $scope.formListaMestra.$setPristine();   
    };
    
    
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
            log("-> Dados salvos com sucesso!");
            var dlg = dialogs.notify("Status",message);
            dlg.result.then(function(){
                if($scope.acao === "UPDATE" || $scope.acao === "ADDPRANCHA")
                    window.close(); 
                 _limpaForm();
            });
        }else{
            dialogs.error("Erro",message);
        }  
    };
    
    /*
    * Envia notificação para o cliente
    * @param {object} data Retorno da API Google Apps Script
    * @param {boolean} status Status da transação
    * @param {string} message Mensagem de retorno
    */
    notificacao = function(data, status, message){
        if(!status)
            return showError(message);
        $scope.registro.codigo = data.codigo;
        if($scope.registro.notificarCliente === "SIM"){
            log("Notificando cliente...");
            $scope.messageLoading = "Notificando cliente...";
            var tipoAcao = $scope.acao === "UPDATE" ? "updateRecord" : "insertRecord";

            lmNotificacao.sendMail($scope.registro,tipoAcao,$scope.params.emailGrupoNotificacao,function(status2, data2, message2){
                if(!status)
                    return showError(message2);
                log("-> Cliente notificado com sucesso!");
                successSalvarDados(data, status, message);
            });  
        }else{
            successSalvarDados(data, status, message);
        }   
    };
    
    /*
    * Atualiza todos os links editáveis de um grupo de pranchas
    * @param {array} regParaAtualizar Array com os registros a serem atualizados
    */
    atualizaLinkEditavel = function(regParaAtualizar,message){
        $scope.messageLoading = "Atualizando links do grupo de pranchas...";
        log("Atualizando links do grupo de pranchas registro código: "+regParaAtualizar[0].codigo+"...");
        regParaAtualizar[0].revisao++;
        regParaAtualizar[0].arquivoEditavel = $scope.registro.arquivoEditavel;
        regParaAtualizar[0].dataDocumento = $filter('date')(new Date(regParaAtualizar[0].dataDocumento),'yyyy-MM-dd');
        var linha = regParaAtualizar[0].linha;
        delete regParaAtualizar[0].linha;
        delete regParaAtualizar[0].adicionar;
        delete regParaAtualizar[0].adicionarPrancha;
        delete regParaAtualizar[0][" feito"];
        googleSheet.updateRecord(regParaAtualizar[0],"linha",linha,"Histórico Revisões",function(data, status, message2){
            if(!status)
                return showError(message2);
            log("-> Registro atualizado com sucesso!");
            regParaAtualizar.shift();
            if(regParaAtualizar.length>0){
                atualizaLinkEditavel(regParaAtualizar,message);
            }else{
                notificacao(data, status, message);
            }
        });
    };
    
    /*
    * Verifica se o arquivo recem gravado faz parte de um grupo de pranchas
    * @param {int} data Linha do registro salvo ou atualizado na planilha
    * @param {boolean} status Status da transação
    * @param {string} message Mensagem de retorno 
    */
    verificaGrupoPranchas = function(data, status, message){
        if(!status)
            return showError(message);
        log("-> Dados gravados com sucesso!");
        var linhaRegAtual = data.linha;
        $scope.registro.codigo = data.codigo;
        if(status && $scope.registro.nGrupoPranchas && $scope.auxArquivoEditavel){
            log("Verificando grupo de pranchas...");
            $scope.messageLoading = "Verificando grupo de pranchas...";
            googleSheet.getAllRecords("associativeArray",function(data, status, message2){
                log("-> Grupo de pranchas verificado!");
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
                log(regParaAtualizar);
                if(regParaAtualizar.length > 0){
                    log("Efetuando backup dos arquivos...");
                    $scope.messageLoading = "Efetuando backup dos arquivos antigos...";
                    lmFiles.makeBackupFiles(arrFilesBackup,$scope.params.idPastaBackup,function(status,data,message2){
                        if(!status)
                            return showError(message2);
                        log("-> Backup efetuado com sucesso!");
                        atualizaLinkEditavel(regParaAtualizar,message);
                    });

                }else{
                    notificacao(data, status, message);
                }
            });
        }else{
            notificacao(data, status, message);
        }
    };
    
    
    /*
    * Inicia a gravação dos dados na planilha do Google
    */        
    gravaDadosPlanilha = function(){
        log("Gravando dados na planilha...");
        // Seta o ID da planilha e nome da página a serem gravados os dados
        googleSheet.setSpreadSheetId($scope.params.idPlanilha);
        googleSheet.setSheetName(config.nameSheetListaMestra);

        switch ($scope.acao) {
            case "NEW" :
                $scope.messageLoading = "Gravando dados na planilha..";
                // Inicia a revisão do arquivo em 1;
                $scope.registro.revisao = 1;
                // Insere um novo registro na planilha
                googleSheet.insertRecord($scope.registro,notificacao);
                break;
            case "UPDATE" :
                $scope.messageLoading = "Atualizando dados na planilha..";
                // Remove as informaçõe que são geradas automaticamente por formulas na planilha
                delete $scope.registro.linha;
                delete $scope.registro.adicionar;
                delete $scope.registro.adicionarPrancha;
                delete $scope.registro[" feito"]; 
                var historicoRevisoes = null;
                // Incrementa a revisão do arquivo;
                if($scope.inseriuNovoArquivo){
                    $scope.registro.revisao++;
                    historicoRevisoes = 'Histórico Revisões'
                }
                // Atualiza um registro na planilha
                googleSheet.updateRecord($scope.registro,"Código",$scope.registro.codigo,historicoRevisoes,verificaGrupoPranchas);
                break;
            case "ADDPRANCHA" :
                $scope.messageLoading = "Gravando dados na planilha...";
                // Remove as informaçõe que são geradas automaticamente por formulas na planilha
                delete $scope.registro.linha;
                delete $scope.registro.adicionar;               
                delete $scope.registro.adicionarPrancha;               
                delete $scope.registro[" feito"];
                // Insere um novo registro na planilha
                googleSheet.insertRecord($scope.registro,notificacao);
                break;
        }
    };
    
    /*
     * Faz upload dos arquivos
     * @param {array} arrayArquivos Array com os arquivos a serem enviados para o Drive
     */
    
    uploadFile = function(arrayArquivos){
        if(arrayArquivos.length > 0){
            if(typeof(arrayArquivos[0].file) === "object" && arrayArquivos[0].file ){
                $scope.inseriuNovoArquivo = true;
                $scope.messageLoading = "Gravando "+arrayArquivos[0].description+"...";
                // Seta as configurações necessárias para enviar os arquivos para o Drive
                lmFiles.setFolderRaiz($scope.params.idPastaRaiz);
                lmFiles.setPatchFolder($scope.registro.localizacaoNoSistema);
                lmFiles.setFile(arrayArquivos[0].file,$scope.registro.nomeArquivo);
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
            log("-> Upload de arquivos finalizado!");
            gravaDadosPlanilha();
        }
    };
    
    /*
     * Renomeia ou move arquivos caso necessário
     */
    renomeiaMoveArquivos = function(arrayArquivos){
        log("Verificando se houve alteração dos arquivos...");
        // Verifica se houve alteração no nome do arquivo
        if($scope.acao === "UPDATE" && ($scope.registro.nGrupoPranchas !== $scope.registroAntigo.nGrupoPranchas ||
           $scope.registro.codigoDoEntregavel !== $scope.registroAntigo.codigoDoEntregavel ||
           $scope.registro.blocos !== $scope.registroAntigo.blocos)){
            $scope.updateMessageloading("Renomeando arquivos...");
            var arrayFilesRename = [];
            angular.forEach(arrayArquivos,function(arquivo){
                if(typeof(arquivo.file) === 'string' && arquivo.file !== "")
                    arrayFilesRename.push(arquivo.file);
            });
            if(arrayFilesRename.length > 0){
                lmFiles.updateNameFiles(arrayFilesRename.slice(0),$scope.registro.nomeArquivo,function(status,data,message){;
                    if(!status)
                        return showError("Erro ao renomear arquivos! "+message);
                    // Verifica se ouve alteração na localização do arquivo
                    if($scope.registro.codigoDoEntregavel !== $scope.registroAntigo.codigoDoEntregavel){
                        log("Atualizando pasta dos arquvivos...");
                        $scope.updateMessageloading("Movendo arquivos...");
                        lmFiles.setFolderRaiz($scope.params.idPastaRaiz);
                        lmFiles.setPatchFolder($scope.registro.localizacaoNoSistema);
                        lmFiles.moveFiles(arrayFilesRename, function(status, data, message){
                            log("-> Pasta atualizada com sucesso!");
                            log("Iniciando Upload de arquivos...");
                            uploadFile(arrayArquivos.slice(0));
                        });
                    }else{
                        log("Iniciando Upload de arquivos...");
                        uploadFile(arrayArquivos.slice(0));  
                    }  
                });
            }else{
                log("Iniciando Upload de arquivos...");
                uploadFile(arrayArquivos.slice(0)); 
            }
        }else{
            log("Iniciando Upload de arquivos...");
            uploadFile(arrayArquivos.slice(0));
        }
    };
    
    
    
    /**
     * Função executada quando o usuário confirma o envio do formulário
     */
    $scope.confirmSalvar = function(){
        log("Salvando dados...");                 

        // Inicializa o progresso da operação salvar 
        $scope.messageLoading = "Processando...";
        $scope.spinerloading = true;
        
        // Busca pelas configurações dos níveis de gestão
        $scope.registro.codigoDoEntregavel = $scope.registro.categoria;
        $scope.registro.codigoDoEntregavel += ($scope.registro.arquivo ? " "+$scope.registro.arquivo : "");
        $scope.registro.codigoDoEntregavel += ($scope.registro.descricao && $scope.params.descricao.indexOf("OUTRO") < 0 ? " "+$scope.registro.descricao : "");
        $scope.registro.localizacaoNoSistema = "";
        for(var i = 0; i < $scope.params.configArquivos.length; i++){
            if($scope.params.configArquivos[i].entregaveis === $scope.registro.codigoDoEntregavel){
                $scope.registro.localizacaoNoSistema = $scope.params.configArquivos[i].localizacaoNoSistema.replace(/{%EMP%}/g, $scope.registro.empreendimento);
                $scope.registro.codigoEtapa = $scope.params.configArquivos[i].codigoEtapa;
                $scope.registro.etapaFinalCronograma = $scope.params.configArquivos[i].etapaFinalCronograma;
                $scope.params.dataNomeArquivo = $scope.params.configArquivos[i].dataNomeArquivo;
                break;
            }
        }
        // Verifica se existe uma localização válida para salvar os arquivos
        if(!$scope.registro.localizacaoNoSistema)
            return showError("Não foi possível identificar a localização do arquivo,\n\
                              o sistema não pode continuar! Por favor entre em contato com \n\
                              o responsável por manter essa configuração.");
        
        // Formata a data
        $scope.registro.dataDocumento = $filter('date')($scope.registro.dataDocumento,'yyyy-MM-dd');
        
        // Faz o tratamento das indicações das pastas físicas
        $scope.registro.servidorTerra = $scope.buttons.ServidorTerra ? "SIM":"NÃO";
        $scope.registro.pastaFisicaCliente = $scope.buttons.PastaFisicaCliente ? "SIM":"NÃO";
        $scope.registro.pastaFisicaTerra = $scope.buttons.PastaFisicaTerra ? "SIM":"NÃO";
        $scope.registro.notificarCliente = $scope.buttons.NotificarCliente ? "SIM":"NÃO";
        

        // Teste se a variável blocos é do tipo objeto. Quando o formulário e submetido 
        // e por algum motivo ocorre um erro, ao ser submetido novamente não precisa fazer
        // este tratamento novamente
        if(typeof($scope.registro.blocos) === "object"){
            // Faz o tratamento dos Blocos
            var auxBlocos = "",
                keys = $scope.registro.blocos? Object.keys($scope.registro.blocos).sort() : "";
            for(var i in keys){auxBlocos += $scope.registro.blocos[keys[i]] ? keys[i]+" ": "";}
            $scope.registro.blocos = auxBlocos.substring(0, auxBlocos.length -1);
        }
        
        // Faz o tratamento da informação Detalhamento
        if($scope.registro.descricao === 'OUTRO'){
            var auxDescArq = $scope.registro.descricao;
            $scope.registro.descricao = $scope.registro.outraDescricaoArquivo;
        }
        delete $scope.registro.outraDescricaoArquivo;
        
        // Monta o nome do arquivo
        $scope.registro.nomeArquivo = $scope.registro.cliente;
        $scope.registro.nomeArquivo += " "+$scope.registro.empreendimento;
        $scope.registro.nomeArquivo += " "+$scope.registro.categoria;
        $scope.registro.nomeArquivo += $scope.registro.arquivo? " "+$scope.registro.arquivo : "";
        $scope.registro.nomeArquivo += $scope.registro.nGrupoPranchas? " "+$scope.registro.nGrupoPranchas : "";
        $scope.registro.nomeArquivo += $scope.registro.blocos? " BLOCOS "+$scope.registro.blocos : "";
        $scope.registro.nomeArquivo += $scope.registro.numeroPrancha? " "+$scope.registro.numeroPrancha : "";
        $scope.registro.nomeArquivo += " "+$scope.registro.descricao;
        $scope.registro.nomeArquivo += $scope.params.dataNomeArquivo === "SIM" ? " "+$scope.registro.dataDocumento: "";
        
        // A partir daqui faz manipulação dos arquivos para enviar para o Google Drive e backup dos arquivos antigos
        // se houver.
        $scope.auxArquivoEditavel = $scope.registro.arquivoEditavel,
        $scope.auxArquivoImpressao = $scope.registro.arquivoImpressao,
        $scope.$scopeauxArquivoPdf = $scope.registro.arquivoPdf;
         
        var arrayArquivos = 
            [{id : "arquivoEditavel",description:"Arquivo Editável", file: null},
            {id : "arquivoImpressao",description:"Arquivo Impressão", file: null},
            {id : "arquivoPdf",description:"Arquivo Pdf", file: null},
            {id : "comprovantePagamento",description:"Comprovante Pagamento", file:null}];
        log(arrayArquivos);
        
        angular.forEach(arrayArquivos,function(arquivo){
            // Se não foi carregado um novo arquivo mantém o arquivo antigo
            if(!$scope.registro[arquivo.id]){
                $scope.registro[arquivo.id] = $scope.params[arquivo.id];
            // Se foi carregado um novo arquivo adiciona o antigo ao array de backup
            }else if($scope.params[arquivo.id]){
                $scope.arrayFilesBackup.push($scope.params[arquivo.id]);
            }
            arquivo.file = $scope.registro[arquivo.id];
        });   
        
        // Verifica qual o tipo de ação NEW, ADDPRANCHA OU UPDATE
        if($scope.acao === "NEW" || $scope.acao === "ADDPRANCHA"){
            // Chama função que irá verificar se precisa fazer upload de arquivos
            uploadFile(arrayArquivos.slice(0));            
        }else{
            // Verifica se precisa fazer backup de arquivos antigos
            if($scope.arrayFilesBackup.length > 0){
                log("Efetuando backup dos arquivos...");
                $scope.messageLoading = "Efetuando backup dos arquivos antigos...";
                lmFiles.makeBackupFiles($scope.arrayFilesBackup,$scope.params.idPastaBackup,function(status,data,message){
                    if(!status)
                        return showError(message);
                    log("-> Backup efetuado com sucesso!");
                    // Chama função que verifica se precisa renomear os arquivos
                    renomeiaMoveArquivos(arrayArquivos);
                });
            }else{
                // Chama função que verifica se precisa renomear os arquivos
                renomeiaMoveArquivos(arrayArquivos);
            }
        } 
        
    };
    /**
    * ************************************************************************************************
    * FIM Salvar Dados
    **/ 
   
    // Seta os parâmetros utilizados pela API do Google Drive
    // e checa a autenticação do usuário
    mtlGdrive.setClientId(config.googleDriveClienteId);
    mtlGdrive.setScopes(config.googleDriveScope);
    mtlGdrive.checkAuth();
        
    // Inicializa os objetos utilizados pelo formulário
    $scope.registro = new Object();
    $scope.params = new Object();
    $scope.buttons = new Object();
    $scope.arrayFilesBackup = [];
    
    if(!util.QueryString.acao || !util.QueryString.empreendimento)
        return showError("Parâmetros 'acao' ou 'empreendimento' não identificado!");
    
    // Pega os parâmetros da URL
    $scope.acao = util.QueryString.acao.toUpperCase();
    $scope.registro.empreendimento = util.QueryString.empreendimento;
    // Verificao qual a ação do formulário
    switch ($scope.acao) {
        case "NEW":
            carregaParametrosIniciais();
            break;
            
        case "UPDATE":
            if(!util.QueryString.codigo)
                return showError("Parâmetro 'codigo' não identificado!");
            $scope.registro.codigo = util.QueryString.codigo;
            carregaParametrosIniciais();
            break;
            
        case "ADDPRANCHA":
            if(!util.QueryString.codigo)
                return showError("Parâmetro 'codigo' não identificado!");
            if(!util.QueryString.nGrupoPranchas)
                return showError("Parâmetro 'nGrupoPranchas' não identificado!");
            $scope.registro.codigo = util.QueryString.codigo;
            $scope.registro.nGrupoPranchas = util.QueryString.nGrupoPranchas;
            //$scope.registro.numeroPrancha = util.QueryString.numeroPrancha + 1;
            carregaParametrosIniciais();
            break;
        default:
            return showError("Parâmetro 'acao' inválido!");
            break;
        
    }    
//    
//    $scope.teste = function(){
//        
//        var stack = new Error();
//        log(stack);
//    };
    
 });