function fixAnchors(){
	var anchors = document.querySelectorAll('a[href]');
	for(index in anchors){
		var anchor = anchors[index];
		if(anchor && anchor.href){
			var host = anchor.href.match(/\/\/(.+\.\w+)\/?/);
			if(host && host[1] !== location.host)
				anchor.setAttribute('target', '_blank');
		}
	}
}

document.addEventListener('DOMContentLoaded', fixAnchors);

var xhr = function(method, path, callback, headers, data){
	var req = new XMLHttpRequest();
	req.open(method, path, true);

	for(var header in headers)
		req.setRequestHeader(header, headers[header]);

	req.onreadystatechange = function(){
		if(this.readyState === 4)
			callback(this, this.status !== 200);
	}

	req.send(data);
}

function get(path, callback, headers){
	xhr('GET', path, callback, headers);
}

function post(path, data, callback, headers){
	xhr('POST', path, callback, headers, data);
}

String.prototype.format = function(){
	var formatted = this;
	for(var arg in arguments)
		formatted = formatted.replace('{' + arg + '}', arguments[arg]);
	return formatted;
}
