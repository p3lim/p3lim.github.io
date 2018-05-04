---
layout: post
title: GitHub Powered Comments
tags: javascript
sha: 43eca2893479069b5f561af9847061a42d396342
---

I'm a big fan of [GitHub Pages](https://pages.github.com/), which this website runs on. So far I haven't done much with it, but I figured I'd mess about and get a comment section for it, just in case :)  
Adding a comments section leaves me with quite a few options, but I figured I'd try to be a bit creative.

Posts on a GitHub Pages website is done through markdown files pushed to a Git repository, which means it will have an accompanying commit page on GitHub (like [this one](https://github.com/p3lim/p3lim.github.io/commit/43eca2893479069b5f561af9847061a42d396342) for this very post you're reading).  
GitHub also has a nice feature that allows users to comment on pretty much anything they'd like, e.g. lines in code, issues, pull requests, _and even commits!_  
An added bonus is that there are moderating capabilities, and even full Markdown support, which is just icing on the cake!

And adding to this, they expose a bit of [repository metadata](https://help.github.com/articles/repository-metadata-on-github-pages/) to [Jekyll](https://jekyllrb.com/), which means that we could easily get enough data through the markup directly without any modifications to the website code (just adding a script and some stylesheets), query the [GitHub API](https://developer.github.com/v3/), and we'd be able to present the comments on the commit as the comments section on a post.

Now, we _could_ get all the data to kind of guess which commit relates to the current post using the API, but there's [rate limiting](https://developer.github.com/v3/#rate-limiting), and it's much slower to do so due to the "guessing" part (multiple queries).  
The alternative is adding a single piece of [front matter](https://jekyllrb.com/docs/frontmatter/) to the post, specifically the commit sha for the commit of the post, and then use that instead since the commit sha is unique within a repository.

### Implementation

So let's put this to the test, example time!

On my website I have two layouts, one that serves as the base for everything, aptly named `base`, and one named `post`. The latter is used for every article published, and is where we'll need to add our modifications.

I have this layout defined as such (simplified):
```html
<article>
	<header><h1>{{ "{{ page.title " }}}}</h1></header>
	<section>{{ "{{ content " }}}}</section>
</article>
```

Simple enough, an `article` element that contains a `header` with the title of the page (or post in this specific context), as well as a `section` containing the post content itself.

Here we'll want to add the metadata from Jekyll, so we can reach it with JavaScript later. Just edit the first line like so:
```html
<article data-nwo='{{ "{{ site.github.repository_nwo " }}}}' data-sha='{{ "{{ page.sha " }}}}'>
```
`site.github.repository_nwo` is basically `username/repository` for the website repository on GitHub, in my example it's `{{ site.github.repository_nwo }}`. `page.sha` is custom frontmatter we place in the top of the posts we want to enable comments on, which represents the commit for the post, added like so:
```
---
layout: post
title: GitHub Powered Comments
sha: {{ page.sha }}
---
```

_The main downside of this is that you'll need to commit the post, then edit it again just to add the frontmatter to it for the `sha` reference. This could easily be automated however._

Lastly, since we'll be using JavaScript for this, we'll create that file and load it at the end of the `post` layout file, like so:

```html
{{ "{% if page.sha " }}%}
<script src='/assets/js/comments.js' async></script>
{{ "{% endif " }}%}
```

Being extra fancy here, we only load the JavaScript file _if_ we've added the sha to the frontmatter, which makes the comments opt-in for every post!

### Fetching the comments

First, lets get the two attributes we added to the article element:
```javascript
const article = document.querySelector('article');
const nwo = article.getAttribute('data-nwo');
const sha = article.getAttribute('data-sha');
```

You'll notice I'm using ES6 here, which all modern browsers today support. Feel free to adjust to ES5, but the rest of this implementation is going to heavily rely on ES6 features.  
In any case, we've now gotten the necessary metadata from the HTML to fetch the comments.

So let's do just that:
```javascript
let handleComments = function(){};

let xhr = new XMLHttpRequest();
xhr.onload = handleComments;
xhr.open('GET', `https://api.github.com/repos/${nwo}/commits/${sha}/comments`);
xhr.send();
```

With that we've queried the [API for the commit comments](https://developer.github.com/v3/repos/comments/#list-comments-for-a-single-commit), ready to parse. Let's expand on the handling:

```javascript
let handleComments = function(){
	// We'll have to make sure that the request responded successfully, so let's check for the return status
	if (this.status === 200){
		// Success! We've received the data we wanted
	} else {
		// Boo! Something went wrong
	}
};
```

Web request, such amaze. Let's handle the successful scenario:

```javascript
let handleComments = function(){
	if (this.status === 200){
		// We'll need a section to place our comments in, so we'll create that first
		article.insertAdjacentHTML('beforeend', '<section id="comments"></section>');

		// Let's assign a variable for that section we just created
		let section = document.querySelector('article #comments');

		// All of the data for the comments lies in the response data, so let's apply some ES6 magic here
		section.insertAdjacentHTML('beforeend', JSON.parse(this.response).map(template).join(''));

		// Lastly, we'll add a link to the commit on GitHub so people know where to add comments
		section.insertAdjacentHTML('beforeend', `
			<div class='gfm'>
				<a href='https://github.com/${nwo}/commit/${sha}#comments'>Leave a comment on GitHub</a>
			</div>
		`);
	}
}
```

_Most_ of that should be rather self-explanatory, but in essence we're just adding elements to a `section`-element at the bottom of the article. The most obfuscated line in there is the line that parses the comments.

What it does is the following: it parses the response from the web request - JSON data containing info for the comments , which it then iterates over through mapping, using a function named `template` that we haven't defined yet. The mapping will return an array, so we join that array into a single string, which we then append to the end of the comments section.

Let's create the `template` function:

```javascript
let template = data => {
	// We're aiming to replicate the GitHub look for comments, so this is mostly just markup for that.
	// The data variable contains everything from the individual comments fetched earlier
	// (see the API docs for info), which we'll use heavily.

	return `
		<div>
			<div class='avatar'>
				<a href='${data.user.html_url}'>
					<img alt='@${data.user.login}' src='${data.user.avatar_url}'>
				</a>
			</div>
			<div class='comment'>
				<div class='header'>
					<h3>
						<a href='${data.user.html_url'>${data.user.login}</a>
					</h3>
				</div>
				<div class='body'>
					${data.body}
				</div>
			</div>
		</div>
	`;
};
```

Aaaaand... we're done! Well, pretty much.  
This is just the essence of it. In addition to the above code, I've added (relative) timestamps using the [Moment.js](https://momentjs.com/) library, as well parsed the comment body using [Marked.js](https://marked.js.org/) (which supports GitHub Flavored Markdown!).  
I've also added error handling, and some stylesheets to make it look pretty.

Here's links to the relevant files in all their glory:
- [\_layouts/post.html](https://github.com/p3lim/p3lim.github.io/blob/master/_layouts/post.html)
- [assets/js/comments.js](https://github.com/p3lim/p3lim.github.io/blob/master/assets/js/comments.js)
- [assets/css/style.scss](https://github.com/p3lim/p3lim.github.io/blob/master/assets/css/style.scss)
	- see the `#comments` section
- [assets/css/gfm.min.css](https://github.com/p3lim/p3lim.github.io/blob/master/assets/css/gfm.min.css)
	- honestly don't know where I found this, would like to provide credit/source

This post has comments enabled using the final code, feel free to test it out and let me know what you think.
