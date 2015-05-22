(function(){
    angular.module('mtl.util',[])
    .service('util',function(){
        
        /**
        * Normalizes a string, by removing all alphanumeric characters and using mixed case
        * to separate words. The output will always start with a lower case letter.
        * This function is designed to produce JavaScript object property names.
        *
        * Examples:
        *   "First Name" -> "firstName"
        *   "Market Cap (millions) -> "marketCapMillions
        *   "1 number at the beginning is ignored" -> "numberAtTheBeginningIsIgnored" --> Isso foi mudado
        *
        * @param {string}      header: The header name to normalize.
        * @param {boolean} removeAlum: True para remover os caracteres especiais
        * @return {string} Normalized header.
        */
        this.normalizeHeaders = function(header, removeAlum){
            header = removeAcentos(header);
            var key = "";
            var upperCase = false;
            for (var i = 0; i < header.length; ++i) {
              var letter = header[i];
              if (letter == " " && key.length > 0) {
                upperCase = true;
                continue;
              }
              if (removeAlum){
                if (!isAlnum(letter)) {
                  continue;
                }
              }

              if (upperCase) {
                upperCase = false;
                key += letter.toUpperCase();
              } else {
                key += letter.toLowerCase();
              }
            }
            return key;    
        };
         
        /**
        * Tests if a character is alphanumeric.
        *
        * @param {string} char The character to test.
        * @return {boolean} True if the character char is alphanumeric, false otherwise.
        * @private
        */
        isAlnum = function(char) {
            return char >= 'A' && char <= 'Z' || char >= 'a' && char <= 'z' || isDigit(char);
        };
        
        /*
        * Essa função serve para trocar uma letra acentuada por uma letra sem acento.
        * @param {string} palavra: Palavra a ser modificada
        * @return {string} Retorna a palavra sem acento
        * @private
        */
        removeAcentos = function(palavra) {
            var com_acento = 'áàãâäéèêëíìîïóòõôöúùûüçÁÀÃÂÄÉÈÊËÍÌÎÏÓÒÕÖÔÚÙÛÜÇ',
                sem_acento = 'aaaaaeeeeiiiiooooouuuucAAAAAEEEEIIIIOOOOOUUUUC',
                nova = '';

            // Remove os caracteres especiais
            palavra = palavra.replace(/[&\/\\#,+\[\]ªº()$~%.'":*?<>{}-]/g,'');

            for ( var i = 0; i < palavra.length; i++ ) {
              if ( com_acento.search(palavra.substr(i,1) ) >=0 ) {
                nova += sem_acento.substr(com_acento.search(palavra.substr(i,1)), 1);
              }
              else {
                nova += palavra.substr(i,1);
              }
            }
            return nova;
        };
  
    })
    /*
    * Diretiva para transformar todos os textos dos inputs em maiúsculo
    */
   .directive('capitalize', function() {
      return {
        require: 'ngModel',
        link: function(scope, element, attrs, modelCtrl) {
           var capitalize = function(inputValue) {
              if(inputValue == undefined) inputValue = '';
              var capitalized = inputValue.toUpperCase();
              if(capitalized !== inputValue) {
                 modelCtrl.$setViewValue(capitalized);
                 modelCtrl.$render();
               }         
               return capitalized;
            }
            modelCtrl.$parsers.push(capitalize);
            capitalize(scope[attrs.ngModel]);  // capitalize initial value
        }
      };
   })
   
   /**
    * Diretira para obter o arquivo dos imputs type file
    */
   .directive("fileread", [function () {
       return {
           scope: {
               fileread: "="
           },
           link: function (scope, element, attributes) {
               element.bind("change", function (changeEvent) {
                   scope.$apply(function () {
                       scope.fileread = changeEvent.target.files[0];
                   });
               });
           }
       };
   }]);
   
   
})();