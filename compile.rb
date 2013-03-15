#!/usr/bin/env ruby

require 'yaml'
require 'haml'
require 'redcarpet'
require 'coderay'
require 'coderay_bash'

class CustomRedcarpet < Redcarpet::Render::HTML
  def block_code(code, language)
    CodeRay.scan(code, language).div
  end
  def image(link, title, alt_text)
    "<figure><a href='#{link}'><img src='#{link}' alt='#{alt_text}' /></a><figcaption>#{title}</figcaption></figure>"
  end
end

module Haml::Filters::Markdown
  include Haml::Filters::Base

  @renderer = Redcarpet::Markdown.new(CustomRedcarpet.new(), {
    :fenced_code_blocks => true,
    :no_intra_emphasis => true,
    :autolink => true,
    :strikethrough => true,
    :lax_html_blocks => true,
    :superscript => true
  })

  def render(text)
    @renderer.render(text)
  end
end

def render(path, locals={}, &block)
  if File.exists? path
    Haml::Engine.new(File.read(path)).render(Object.new, locals, &block)
  end
end

layout = Haml::Engine.new(File.read('templates/layout.html.haml'))

template = Haml::Engine.new(File.read('templates/post.html.haml'))
posts = YAML.load_file('posts.yaml')
posts.each do |post|
  File.open("public/#{post[:path]}.html", 'w') { |f|
    f.write layout.render(Object.new, {:title=>"Joe Frambach #{post[:title]}"}) {
      template.render(Object.new, post)
    }
  }
end

File.open("public/index.html",'w') {|f|
  f.write layout.render(Object.new, {:title=>"Joe Frambach",:posts=>posts[0..5]}) {
    render("templates/index.html.haml", {:title=>"Joe Frambach",:posts=>posts[0..5]})
  }
}

File.open("public/posts.html",'w') {|f|
  f.write layout.render(Object.new, {:title=>"Joe Frambach",:posts=>posts[0..5]}) {
    render("templates/posts.html.haml", {:title=>"Joe Frambach",:posts=>posts})
  }
}


