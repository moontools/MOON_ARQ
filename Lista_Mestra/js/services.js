app.service('lmFiles',function(mtlGdrive,$timeout){
    
    var idFolderRaiz = null; // Id da pasta raiz
    var fileData = null; // Arquivo a ser inserido
    var titleFile = null; // Nome do arquivo
    var folder = null; // Localização onde o arquivo deverá ser inserido
    var processing = false; // Indica se o processo de inserção de arquivo esta em andamento
    var status = false; // Indica o status do
    var linkArquivo = null; // Link do arquivo após ser enviado para o drive
    var message = ""; // Mensagem utilizada em caso de erros
        
    /*
     * Varre todas as pastas e subpastas de uma pasta pai para conhecer sua estrutura
     * Obs: Essa função trabalha de forma recursiva
     * @param {type} Objeto para identificar cada pasta
     * @param {type} idFolder Id folder da pasta raiz
     * @returns {undefined}
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
     * @param {type} idFolder id da pasta pai
     * @param {type} patchFolder array com as pastas a serem encontradas
     * @returns {undefined}
     */
    var descobreFilhos = function(idFolder,patchFolder){
        if(patchFolder.length > 0){
            mtlGdrive.getInfoFile(idFolder,function(result){
                if(result.error)
                    return error(result.error.message);
                mtlGdrive.listChildrenInFolder(idFolder,function(result){
                    if(result.error)
                        return error(result.error.message);
                    conhecerFilhos(idFolder,result.items,patchFolder);
                });  
            });
        }else{
            saveFile([idFolder]);
        }
    }; 
    
    /*
     * Varre as pastas e arquivos filhos de uma determinada pasta pai buscando por determinadas pastas
     * @param {type} idFolder id da pasta pai
     * @param {type} itens filhos a serem conhecidos
     * @param {type} patchFolder Array contendo o nome das pastas a serem localizadas
     * @returns {undefined}
     */
    var conhecerFilhos = function(idFolder,itens,patchFolder){
        if(itens.length > 0){
            mtlGdrive.getInfoFile(itens[0].id,function(result){
                if(result.error)
                    return error(result.error.message);
                if(result.mimeType === 'application/vnd.google-apps.folder' && result.title === patchFolder[0]){
                    console.log("Achei a pasta "+result.title);
                    patchFolder.shift();
                    descobreFilhos(result.id,patchFolder);
                }else{
                    console.log("Estou procurando");
                    itens.shift();
                    conhecerFilhos(idFolder,itens,patchFolder);
                }
            });
        }else{
            console.log("Terminei a procura de "+patchFolder[0]+" e não achei");
            criarPasta(patchFolder,idFolder);
        }
    };
    
    /*
     * Cria uma pasta no Drive
     * @param {type} patchFolder Array contendo o nome das pastas a serem criardas
     *               Obs: O nome da pasta a ser criada no momento deve estas na primeira posição do array
     * @param {type} idParent Id da pasta pasta pai onde será criada a nova pasta
     */
    var criarPasta = function(patchFolder, idParent){
        if(patchFolder.length > 0){
            console.log("Vou criar a pasta "+patchFolder[0]+" na pasta cujo id é "+idParent);
                mtlGdrive.createFolder(patchFolder[0],[idParent],function(result){
                    if(result.error)
                        return error(result.error.message);
                    console.log("Criei a pasta "+patchFolder[0]+" cujo id é "+result.id);
                    patchFolder.shift();
                    criarPasta(patchFolder,result.id);
            });
        }else{
            saveFile([idParent]);
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
      folder = patchFolder.split("/") ? patchFolder.split("/") : patchFolder;
    };
    
    /*
     * Envia o arquivo para o Google Drive
     * @params {array} parents Array com os ids das pastas onde o arquivo deverá ser inserido;
     */
    var saveFile = function(parents){
        console.log("Vou inserir o arquivo "+fileData);
        if(!fileData)
            return error("Tentativa de upload de arquivo inválido.");
        mtlGdrive.insertFile(fileData,titleFile,parents,function(result){
            if(result.error)
                return error(result.error.message);
            console.log("Inseri o arquivo");
            linkArquivo = result.alternateLink;
            status = true;
            processing = false;
        });
    };
    
    /*
     * Move um arquivo
     * @param {string} folderOrigemId Id da pasta de origem
     * @param {type} fileId Id ddo arquivo a ser movido
     * @param {type} FolderDestinoId Id da pasta destino
     * @param {function} callback Função a ser executada ao fim da requisição
     * @returns {function} callback executa função de callback
     */
    var moveFile = function(arrayFilesLink,FolderDestinoId,callback){
        if(arrayFilesLink.length > 0){
            var idFile = arrayFilesLink[0].split("file/d/")[1];
                idFile = idFile.split("/edit")[0];
            console.log("Obtendo informação do arquivo "+arrayFilesLink[0]);
            mtlGdrive.getInfoFile(idFile,function(result){
                var id = result.id,
                    fileInf = result;
                console.log(result);
                console.log("Adicionando o arquivo cujo id é "+id+" na pasta cujo id é "+FolderDestinoId);
                mtlGdrive.addFileIntoFolder(FolderDestinoId, id,function(result){
                    if(result.error){
                        callback(false,result,result.error);
                    }else{
                        if(fileInf.parents.length > 0){
                            console.log("Removendo o arquivo cujo id é "+id+" da pasta cujo id e é "+fileInf.parents[0].id);
                            mtlGdrive.removeFileFromFolder(fileInf.parents[0].id,id,function(result){
                                if(result){
                                    if(result.error){
                                        callback(false,result,result.error);
                                    }
                                }else{
                                    arrayFilesLink.shift();
                                    moveFile(arrayFilesLink,FolderDestinoId,callback);
                                }
                            });
                        }else{
                            console.log(arrayFilesLink);
                            arrayFilesLink.shift();
                            moveFile(arrayFilesLink,FolderDestinoId,callback);
                        }
                    }
                }); 
            });
        }else{
            callback(true,null,"Backup efetuado com sucesso!");
        }   
    };
    
    
    this.makeBackupFiles = function(arrayFilesLink,idFolderBackup,callback){
        console.log("Iniciando backup dos aquivos");
        moveFile(arrayFilesLink,idFolderBackup,function(status,data,message){
           callback(status,data,message); 
        });
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
                descobreFilhos(idFolderRaiz,folder);
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