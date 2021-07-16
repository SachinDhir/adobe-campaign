//Load Google CyptoJS library in Adobe Campaign JavaScript folder
loadLibrary('cus:crypto.js') ;

var access_key = '<your AWS access key>'
var secret_key = '<your AWS secret key>'
var region = '<region>';
var hostUrl = 'myhostdomain.s3.amazonaws.com';
var uriPath = '/';
var awsService = 'execute-api';
var httpMethod = 'POST';   //GET or POST
var content_type = 'application/x-amz-json-1.0';
var endpoint = 'https://' + hostUrl + uriPath;

// Payload would be empty for GET request and json string for POST request
var payload = '{"products": [{"sku": "xyz"}]}';

// ISO8601 date format to the specific format the AWS API
function getAmzDate(dateStr) {
  var chars = [":","-"];
  for (var i=0;i<chars.length;i++) {
    while (dateStr.indexOf(chars[i]) != -1) {
      dateStr = dateStr.replace(chars[i],"");
    }
  }
  dateStr = dateStr.split(".")[0] + "Z";
  return dateStr;
}

// Function returns the Signature Key, see AWS documentation for more details
function getSignatureKey(key, dateStamp, regionName, serviceName) {
    var kDate = CryptoJS.HmacSHA256(dateStamp, "AWS4" + key);
    var kRegion = CryptoJS.HmacSHA256(regionName, kDate);
    var kService = CryptoJS.HmacSHA256(serviceName, kRegion);
    var kSigning = CryptoJS.HmacSHA256("aws4_request", kService);
    return kSigning;
}

// Get the date formats needed to form our request
var amzDate = getAmzDate(new Date().toISOString());
var authDate = amzDate.split("T")[0];

// Get the SHA256 hash value for our payload
var hashedPayload = CryptoJS.SHA256(payload).toString();

// Step 1: Create our canonical request
var canonicalReq =  httpMethod + '\n' +
                    uriPath + '\n' +
                    '\n' +
                    'host:' + hostUrl + '\n' +
                    'x-amz-content-sha256:' + hashedPayload + '\n' +
                    'x-amz-date:' + amzDate + '\n' +
                    '\n' +
                    'host;x-amz-content-sha256;x-amz-date' + '\n' +
                    hashedPayload;
          

// Hash the canonical request
var canonicalReqHash = CryptoJS.SHA256(canonicalReq).toString();  


// Step 2: Form our String-to-Sign
var stringToSign =  'AWS4-HMAC-SHA256\n' +
                    amzDate + '\n' +
                    authDate+'/'+region+'/'+awsService+'/aws4_request\n'+
                    canonicalReqHash;

// Step 3: Get Signing Key
var signingKey = getSignatureKey(secret_key, authDate, region, awsService);

// Get Signing Signature
var signature = CryptoJS.enc.Hex.stringify(CryptoJS.HmacSHA256(stringToSign, signingKey));

// Step 4: Form our authorization header
var authString  = 'AWS4-HMAC-SHA256 ' +
                  'Credential='+
                  access_key+'/'+
                  authDate+'/'+
                  region+'/'+
                  awsService+'/aws4_request,'+
                  'SignedHeaders=host;x-amz-content-sha256;x-amz-date,'+
                  'Signature='+signature;

logInfo("authorization >>" + authString);  
var req = new HttpClientRequest(endpoint)
req.header["Authorization"] = authString;
req.header["Content-Type"] = content_type;
req.header["X-Amz-Date"] = amzDate;
req.header["x-amz-content-sha256"] = hashedPayload;
req.method = "POST";
req.body = payload;

try {
  req.execute()
}
catch(e)
{
  logInfo(e)
}

var response = req.response;
var content = response.body.toString(response.codePage);
logInfo(content);
req.disconnect();