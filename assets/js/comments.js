const article = document.querySelector('article');
const nwo = article.getAttribute('data-nwo'); // site.github.repository_nwo
const sha = article.getAttribute('data-sha'); // page.sha (custom front-matter)

let section = document.createElement('section');
section.id = 'comments';
section.appendChild(document.createElement('hr'));
article.appendChild(section);

const TEMPLATE = `
<div class='avatar'>
	<a href='{user_url}'>
		<img alt='@{user_name}' src='{avatar_url}'>
	</a>
</div>
<div class='comment'>
	<div class='header'>
		<h3>
			<strong>
				<a href='{user_url}'>{user_name}</a>
			</strong>
			commented
			<a class='timestamp' href='{comment_url}'>
				<relative-time datetime='{comment_date}' title='{time_accurate}'>{time_relative}</relative-time>
			</a>
		</h3>
	</div>
	<div class='body gfm'>
		{comment_body}
	</div>
</div>
`

function handler(){
	if(this.status !== 200)
		return;

	let comments = JSON.parse(this.response);
	for(let index in comments){
		let comment = comments[index];
		let box = document.createElement('div');
		box.innerHTML = TEMPLATE.replace(/{user_url}/g, comment.user.html_url)
								.replace(/{user_name}/g, comment.user.login)
								.replace(/{avatar_url}/g, comment.user.avatar_url)
								.replace(/{time_accurate}/g, moment(comment.created_at).format('MMM D, YYYY, HH:mm'))
								.replace(/{time_relative}/g, moment(comment.created_at).fromNow())
								.replace(/{comment_url}/g, comment.html_url)
								.replace(/{comment_date}/g, comment.created_at)
								.replace(/{comment_body}/g, marked(comment.body, {gfm:true}));

		if(comment.author_association === 'OWNER')
			box.classList.add('author');

		section.appendChild(box);
	}

	section.append(`<div class='gfm'><a href='https://github.com/${nwo}/commit/${sha}#comments'>Leave a comment on GitHub</a></div>`);
}

let xhr = new XMLHttpRequest();
xhr.onload = handler;
xhr.open('GET', 'https://api.github.com/repos/' + nwo + '/commits/' + sha + '/comments');
xhr.send();
