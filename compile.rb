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

$template_engines = {}
def render(template, locals={}, &block)
  $template_engines[template] ||= Haml::Engine.new(File.read(template))
  $template_engines[template].render(Object.new, locals, &block)
end

def render_to_file(outfile, locals={}, &block)
  locals[:title] ||= "Joe Frambach"
  File.open(outfile, 'w') { |f|
    f.write render('templates/layout.haml', locals, &block)
  }
end

def render_link(url, text, show_post_count=false, active=false)
  post_count = show_post_count ? $tags[text].size : 0
  text += (post_count > 1 ? " x #{post_count}" : '')
  render('templates/tag.haml', {:url=>url, :text=>text, :active=>active})
end

$posts = YAML.load_file('posts.yaml')
$posts.map! do |post|
  src = File.read("posts/#{post[:path]}.haml")
  post[:images] = src.scan(/^\s*!\[[^\]]+\]\(([^ \)]+)[^\)]*\)$/).collect(&:first)
  post
end

$tags = {}
$posts.each do |post|
  post[:tags].each do |tag|
    $tags[tag] ||= []
    $tags[tag] << post
  end
end
$sorted_tags = $tags.sort_by{|tag,posts| -posts.size}

system('mkdir -p staging')
system('rm -r staging/*')

$posts.each do |post|
  render_to_file("staging/#{post[:path]}.html", {:title=>"Joe Frambach - #{post[:title]}"}) {
    render('templates/post.haml', post)
  }
end

post_pages = $posts.each_slice(5).to_a
system('mkdir -p staging/page')
post_pages.each_with_index do |posts,page|
  render_to_file("staging/page/#{page+1}.html", {:page=>page+1, :pages=>post_pages.size, :path=>'/'}) {
    render("templates/post_previews.haml", {:posts=>posts})
  }
end

system('mv staging/page/1.html staging/index.html')

$tags.each do |tag, tag_posts|
  system("mkdir -p staging/tag/#{tag}/page")
  tag_pages = tag_posts.each_slice(5).to_a
  tag_pages.each_with_index do |posts, page|
    render_to_file("staging/tag/#{tag}/page/#{page+1}.html", {:title=>"Joe Frambach - #{tag}", :page=>page+1, :pages=>tag_pages.size, :path=>"/tag/#{tag}/", :selected_tag=>tag}) {
      render("templates/post_previews.haml", {:posts=>posts})
    }
  end
  system("mv staging/tag/#{tag}/page/1.html staging/tag/#{tag}.html")
end

system('rm public/*.html')
system('find public/tag/ -type f -delete')
system('find public/page/ -type f -delete')
system('cp -R staging/* public')
system('cp resume/resume.html public/resume.html')
