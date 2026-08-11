export class HttpRequest {
    public static async do(method: string, url: string | URL, data?: any, headers?: Map<string, string>): Promise<string> {
        return new Promise(function(resolve, reject) {
          var xhr = new XMLHttpRequest();
          xhr.open(method, url, true);
      
          if (headers) {
            for (var key in headers) {
              xhr.setRequestHeader(key, headers[key]);
            }
          }
      
          xhr.onload = function() {
            if (this.status >= 200 && this.status < 300) {
              resolve(xhr.responseText);
            } else {
              reject(new Error(xhr.statusText));
            }
          };
      
          xhr.onerror = function() {
            reject(new Error('Network error'));
          };
      
          xhr.ontimeout = function() {
            reject(new Error('Request timeout'));
          };
      
          xhr.send(data);
        });
    }}