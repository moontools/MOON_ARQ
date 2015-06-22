/* Serviços responsável pela manipulação dos arquivos da Lista Mestra
 * 
 * @param {object} mtlGdrive Objeto para manipulação de arquivos do Google Drive
 * @param {type} $timeout Objeto para manipula delays de execução
 */
app.service('lmFiles',function(mtlGdrive,$timeout){
    
    var idFolderRaiz = null; // Id da pasta raiz
    var fileData = null; // Arquivo a ser inserido
    var titleFile = null; // Nome do arquivo
    var folderDestino = null; // Localização onde o arquivo deverá ser inserido
    var processing = false; // Indica se o processo de inserção de arquivo esta em andamento
    var status = false; // Indica o status do
    var linkArquivo = null; // Link do arquivo após ser enviado para o drive
    var message = ""; // Mensagem utilizada em caso de erros
        
    /*
     * Varre todas as pastas e subpastas de uma pasta pai para conhecer sua estrutura
     * Obs: Essa função trabalha de forma recursiva
     * @param {object} Objeto para identificar cada pasta
     * @param {string} idFolder Id folder da pasta raiz
     */
    var varreEstruturaDeFolder = function(parent,idFolder){
        mtlGdrive.listChildrenInFolder(idFolder,function(result){
            if(result.error)
                    return error(result.error.message);
            var children = result.items;
            for(var i in children){
                mtlGdrive.getInfoFile(children[i].id,function(result){
                    if(result.error)
                        return error(result.error.message);
                    if(result.mimeType === 'application/vnd.google-apps.folder' && result.title == ''){
                        var filho = {
                            id:result.id,
                            title:result.title,
                            children: []
                        };
                        parent.children.push(filho);
                        descobreFilhos(parent.children[parent.children.length-1],result.id);
                    } 
                }); 
            }
            
        });  
    }; 

    /*
     * Função de erro padrão
     * @param {string} error Mensagem de erro a ser retornada
     */
    var error = function(error){
        message = error;
        status = false;
        processing = false;
    };
    
    /*
     * Descobre quantos quantos filhos existem um uma pasta pai
     * @param {string} idFolder id da pasta pai
     * @param {array} patchFolder array com as pastas a serem encontradas
     * @param {function} função a ser executada assim que a pasta desejada for encontrada ou criada
     */
    var descobreFilhos = function(idFolder,patchFolder,execFuncion){
        if(patchFolder.length > 0){
            mtlGdrive.getInfoFile(idFolder,function(result){
                if(result.error)
                    return error(result.error.message);
                mtlGdrive.listChildrenInFolder(idFolder,function(result){
                    if(result.error)
                        return error(result.error.message);
                    conhecerFilhos(idFolder,result.items,patchFolder,execFuncion);
                });  
            });
        }else{
            execFuncion([idFolder]);
        }
    }; 
    
    /*
     * Varre as pastas e arquivos filhos de uma determinada pasta pai buscando por determinadas pastas
     * @param {string} idFolder id da pasta pai
     * @param {array} itens filhos a serem conhecidos
     * @param {array} patchFolder Array contendo o nome das pastas a serem localizadas
     * @param {function} função a ser executada assim que a pasta desejada for encontrada ou criada
     */
    var conhecerFilhos = function(idFolder,itens,patchFolder,execFuncion){
        if(itens.length > 0){
            log("Estou procurando a pasta "+patchFolder[0]+"...");
            mtlGdrive.getInfoFile(itens[0].id,function(result){
                if(result.error)
                    return error(result.error.message);
                if(result.mimeType === 'application/vnd.google-apps.folder' && result.title === patchFolder[0]){
                    log("-> Achei a pasta "+result.title);
                    patchFolder.shift();
                    descobreFilhos(result.id,patchFolder,execFuncion);
                }else{
                    itens.shift();
                    conhecerFilhos(idFolder,itens,patchFolder,execFuncion);
                }
            });
        }else{
            log("-> Terminei a procura de "+patchFolder[0]+" e não achei!");
            criarPasta(patchFolder,idFolder,execFuncion);
        }
    };
    
    /*
     * Cria uma pasta no Drive
     * @param {array} patchFolder Array contendo o nome das pastas a serem criardas
     *               Obs: O nome da pasta a ser criada no momento deve estas na primeira posição do array
     * @param {string} idParent Id da pasta pasta pai onde será criada a nova pasta
     * @param {function} função a ser executada assim que a pasta desejada for encontrada ou criada
     */
    var criarPasta = function(patchFolder, idParent, execFuncion){
        if(patchFolder.length > 0){
            log("Vou criar a pasta "+patchFolder[0]+" na pasta cujo id é "+idParent+"...");
            mtlGdrive.createFolder(patchFolder[0],[idParent],function(result){
                if(result.error)
                    return error(result.error.message);
                log("-> Criei a pasta "+patchFolder[0]+" cujo id é "+result.id);
                patchFolder.shift();
                criarPasta(patchFolder,result.id, execFuncion);
            });
        }else{
            execFuncion([idParent]);
        }
    };
    
    /*
     * Seta o id da pasta raiz
     * @params {string} id da pasta
     */
    this.setFolderRaiz = function(idFolder){
      idFolderRaiz = idFolder;  
    };
    
    /*
     * Seta o arquivo a ser enviado para o Google Drive
     * @params {file} file Arquivo no formato file
     * @params {string} title Nome do arquivo
     */
    this.setFile = function(file,title){
      fileData = file;  
      titleFile = title;
    };
    
    /*
     * Seta o caminho da pasta onde o arquivo deverá ser inserido, a partir da pasta raiz
     * @params {string} patchFolder Obs: Casa pasta deve ser separada por /
     */
    this.setPatchFolder = function(patchFolder){
      folderDestino = patchFolder.split("/") ? patchFolder.split("/") : patchFolder;
    };
    
    /*
     * Envia o arquivo para o Google Drive
     * @params {array} parents Array com os ids das pastas onde o arquivo deverá ser inserido;
     */
    var saveFile = function(parents){
        log("Vou inserir o arquivo "+fileData+"...");
        if(!fileData)
            return error("Tentativa de upload de arquivo inválido.");
        mtlGdrive.insertFile(fileData,titleFile,parents,function(result){
            if(result.error)
                return error(result.error.message);
            log("-> Arquivo inserido!");
            linkArquivo = result.alternateLink;
            status = true;
            processing = false;
        });
    };
    
    /*
     * Move arquivos no drive
     * @param {array} arrayFilesLink Array com os ids dos arquivos a serem movidos
     * @param {string} FolderDestinoId Id do folder destino
     * @param {function} callback Função a ser executada ao fim da requisição
     * @returns {function} callback function
     */
    var _moveFiles = function(arrayFilesLink,FolderDestinoId,callback){
        if(arrayFilesLink.length > 0){
            var idFile = arrayFilesLink[0].split("file/d/")[1];
                idFile = idFile.split("/edit")[0];
            log("Obtendo informação do arquivo "+arrayFilesLink[0]+"...");
            mtlGdrive.getInfoFile(idFile,function(result){
                var id = result.id,
                    fileInf = result;
                log("Adicionando o arquivo cujo id é "+id+" na pasta cujo id é "+FolderDestinoId+"...");
                mtlGdrive.addFileIntoFolder(FolderDestinoId, id,function(result){
                    if(result.error){
                        callback(false,result,result.error);
                    }else{
                        log("-> Arquivo adicionado!");
                        var folderOrigem = null;
                        angular.forEach(fileInf.parents,function(parent){
                           if(parent.id !== FolderDestinoId)
                               folderOrigem = parent.id;
                        });
                        if(folderOrigem){
                            log("Removendo o arquivo cujo id é "+id+" da pasta cujo id e é "+fileInf.parents[0].id);
                            mtlGdrive.removeFileFromFolder(folderOrigem,id,function(result){
                                if(result){
                                    if(result.error){
                                        callback(false,result,result.error);
                                    }
                                }else{
                                    log("-> Arquivo removido!");
                                    arrayFilesLink.shift();
                                    _moveFiles(arrayFilesLink,FolderDestinoId,callback);
                                }
                            });
                        }else{
                            arrayFilesLink.shift();
                            _moveFiles(arrayFilesLink,FolderDestinoId,callback);
                        }
                    }
                }); 
            });
        }else{
            log("-> Arquivos movidos com sucesso!");
            callback(true,null,"Arquivos movidos com sucesso!");
        }   
    };
    
    /*
     * Inicia o backup dos arquivos
     * @param {array} arrayFilesLink Array com os ids dos arquivos a serem movidos
     * @param {string} FolderDestinoId Id do folder destino
     * @param {function} callback Função a ser executada ao fim da requisição
     * @returns {function} callback function
     */
    this.makeBackupFiles = function(arrayFilesLink,idFolderBackup,callback){
        log("Movendo aquivos...");
        _moveFiles(arrayFilesLink,idFolderBackup,callback);
    };
    
    
    this.moveFiles = function(arrayFilesLink, callback){
        descobreFilhos(idFolderRaiz,folderDestino,function(FolderDestinoId){
            _moveFiles(arrayFilesLink,FolderDestinoId,callback);
        });
    };
    
    /*
     * Renomeia um arquivo no drive
     * @param {array} arrayFilesId Array com o id dos arquivos a terem o nome atualizado.
     * @param {string} title Novo nome para os arquivos
     * @param {function} callback Função a ser executada ao fim da requisição
     * @returns {function} callback function
     */
    var renameFiles = function(arrayFilesId,title,callback){
        if(arrayFilesId.length > 0){
            var idFile = arrayFilesId[0].split("file/d/")[1];
                idFile = idFile.split("/edit")[0];
            mtlGdrive.getInfoFile(idFile,function(result){
                var metaData = {
                    'title' : title+"."+result.fileExtension,
                };
                mtlGdrive.updateMetadataFile(idFile, metaData, function(result){
                    if(result.error){
                        callback(false,null,result.error.message);
                    }else{
                        arrayFilesId.shift();
                        renameFiles(arrayFilesId,title,callback);
                    }
                }); 
            });

        }else{
            log("-> Arquivos renomeados com sucesso!");
            callback(true,null,'Arquivos renomeados com sucesso!');
        }  
    };
    
    /*
     * Inicia a atualização do nome dos arquivos
     * @param {array} arrayFilesId Array com o id dos arquivos a terem o nome atualizado.
     * @param {string} title Novo nome para os arquivos
     * @param {function} callback Função a ser executada ao fim da requisição
     * @returns {function} callback function
     */
    this.updateNameFiles = function(arrayFilesId,title,callback){
        log("Renomeando arquivos...");
        renameFiles(arrayFilesId,title,callback); 
    };
    
    
    /*
     * Inicia o processo de upload do arquivo
     * @params {callback} Função a ser executada ao final da execução do processo de upload.
     */
    this.uploadFile = function(callback){
        try{
            // Indica que o processo iniciou
            processing = true;
            if(!idFolderRaiz){
                saveFile(null);
            }else{
                descobreFilhos(idFolderRaiz,folderDestino,saveFile);
            }
            // Entra em looping esperando o processo terminar
            (checkStatus = function(){
                $timeout(function(){
                    if(!processing){
                        callback(status,linkArquivo,message);
                    }else{
                        checkStatus(); 
                    }
                },1000);
            })();
        }catch(e){
           callback(status,null,e.message); 
        }
    };
});

/*
 * Serviço para enviar e-mail de notificação da Lista Mestra
 */
app.service('lmNotificacao',function($http){
    
    // Urls da API Apps Script
    var _urlDev = 'https://script.google.com/a/macros/moontools.com.br/s/AKfycbwSZT17hrIQPEtcQcylNMH_XF47rdWxCTJLxZm5Klw/dev',
        _urlExec = 'https://script.google.com/macros/s/AKfycbwtCImR4EdpIaZ3lOTByJde9njlUwQSn3BM6HXef6MXFtr3AEk/exec';
    
    /*
     * Envia o e-mail de notificação
     * 
     * @param {object} registro Dados do registro inserido ou atualizado.
     * @param {string} tipoAcao Tipo de Ação. Registro novo ou Atualização de registro existente.
     * @param {string} emailGrupoNotificacao Email do grupo a ser notificado.
     * @param {function} callback Função a ser executada ao fim da requisição
     * @returns {function} callback function
     */
    this.sendMail = function(registro,tipoAcao,emailGrupoNotificacao,callback){
        
        registro.tipoAcao = tipoAcao,
        registro.emailGrupoNotificacao = emailGrupoNotificacao;
        
        var _urlApi = localStorage.development === 'true' ? _urlDev : _urlExec; 

        $http({url:_urlApi+"?callback=JSON_CALLBACK",
               method:"jsonp",
               params:registro
        }).success(function(data, status, headers, config){
           callback(data.status, data.data, data.message);
        }).error(function(data, status, headers, config){
           callback(data, false, status);
        }); 
    };
    
});