---
layout: post
title: Markdown with Redcarpet
date: 2013-03-16
category: 'blog'
tag: 'tech'

---

### Update

I am no longer using this renderer. I am now using Jekyll 3.0 with Liquid and kramdown.


---


### Original text, 2013:

Markdown uses this syntax for placing images:

``` plain
![Alt text](/path/to/img.jpg "Optional title")
```

The resulting markup looks like this:

``` html
<img src="/path/to/img.jpg" alt="Alt text" title="Optional title">`
```

But I wanted the resulting markup to look like this:

``` html
<figure>
  <img src="/path/to/img.jpg" alt="Alt text" />
  <figcaption>Optional title</figcaption>
</figure>
```

It took a few attempts to get this going, but in the end it was surprisingly
easy. I'm rewriting the `image` method in Redcarpet, and telling Haml to use
my extended class instead of stock Redcarpet.

``` ruby
require 'haml'
require 'redcarpet'

class CustomRedcarpet < Redcarpet::Render::HTML
  def image(link, title, alt_text)
    "<figure><a href='\#{link}'><img src='\#{link}' alt='\#{alt_text}' /></a><figcaption>\#{title}</figcaption></figure>"
  end
end

module Haml::Filters::Markdown
  include Haml::Filters::Base

  @renderer = Redcarpet::Markdown.new(CustomRedcarpet.new())

  def render(text)
    @renderer.render(text)
  end
end
```

---

### Update, 2015:

Some component of Ruby 2.0.0, Haml, or Redcarpet decided to not work anymore. The solution was a slight modification, below:

``` ruby
require 'haml'
require 'redcarpet'

class CustomRedcarpet < Redcarpet::Render::HTML
  def image(link, title, alt_text)
    "<figure><a href='\#{link}'><img src='\#{link}' alt='\#{alt_text}' /></a><figcaption>\#{title}</figcaption></figure>"
  end
end

module Haml::Filters

  remove_filter("Markdown")

  module Markdown
    include Haml::Filters::Base

    @renderer = Redcarpet::Markdown.new(CustomRedcarpet.new())

    def render(text)
      @renderer.render(text)
    end
  end
end
```
