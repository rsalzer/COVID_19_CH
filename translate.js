// Thanks to
// http://www.ab-weblog.com/en/internationalization-how-to-localize-html5-projects/

function loaded()
{
  var lang = getParameterValue("lang");
  if (lang != "") String.locale = lang;

  walk(document, function(n) {
    if (n.nodeValue) {
      if (n.nodeValue.toLocaleString() !== n.nodeValue) {
        n.nodeValue = n.nodeValue.toLocaleString();
      } else {
        var t = n.nodeValue.trim()
        if (t.toLocaleString() !== t) {
          n.nodeValue = " " + t.toLocaleString() + " "
        }
      }
    }
  })
}

function getParameterValue(parameter)
{
  parameter = parameter.replace(/[\[]/, "\\\[").replace(/[\]]/, "\\\]");
  var regexS = "[\\?&]" + parameter + "=([^&#]*)";
  var regex = new RegExp(regexS);
  var results = regex.exec(window.location.href);
  if(results == null)
    return "";
  else
    return results[1];
}

function walk(node, func) {
    func(node);
    node = node.firstChild;
    while (node) {
        walk(node, func);
        node = node.nextSibling;
    }
};

var _ = function (string) {
  return string.toLocaleString();
};
