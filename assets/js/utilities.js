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
