require 'nokogiri'
require 'cgi'

module Portfolio
  class Pages < Jekyll::Generator
    safe true
    priority :normal
    def generate(site)
      converter = site.find_converter_instance(Jekyll::Converters::Markdown)
      site.posts.docs.each do |post|
        first_paragraph = Nokogiri::HTML.fragment(converter.convert(post.content)).at_css('p')&.text
        post.data['description'] ||= first_paragraph.to_s.strip
      end
      site.data.fetch('work', []).each do |work|
        page = Jekyll::PageWithoutAFile.new(site, site.source, "work/#{work['id']}", 'index.html')
        page.data.merge!('layout' => 'work', 'title' => work['title'], 'description' => work['summary'], 'work' => work)
        site.pages << page
      end
      %w[categories tags].each do |kind|
        groups = {}
        site.posts.docs.each do |post|
          Array(post.data[kind]).each do |name|
            slug = Jekyll::Utils.slugify(name)
            groups[slug] ||= { 'name' => name, 'posts' => [] }
            groups[slug]['posts'] << post unless groups[slug]['posts'].include?(post)
          end
        end
        site.config["portfolio_#{kind}"] = groups.sort.map do |slug, group|
          page = Jekyll::PageWithoutAFile.new(site, site.source, "#{kind}/#{slug}", 'index.html')
          page.data.merge!('layout' => 'taxonomy', 'title' => group['name'], 'description' => "#{group['name']} entries in Aidan Chen's cybersecurity journal.", 'entries' => group['posts'].sort_by(&:date).reverse, 'taxonomy_type' => kind, 'taxonomy_home' => "/#{kind}/")
          site.pages << page
          { 'name' => group['name'], 'url' => "/#{kind}/#{slug}/", 'count' => group['posts'].size }
        end
      end
    end
  end
  module Filters
    def entry_number(input)
      input.to_i.to_s.rjust(2, '0')
    end

    def slug_path(input)
      parts = input.split('/')
      "/#{parts[1]}/#{Jekyll::Utils.slugify(parts[2..].join('/'))}/"
    end
    def article_html(input)
      site = @context.registers[:site]
      base = site.baseurl.to_s
      fragment = Nokogiri::HTML.fragment(input)
      # Preserve source Markdown while ensuring a single page-level h1.
      fragment.css('h1').each { |node| node.name = 'h2' }
      fragment.css('img').each do |node|
        source = node['src']
        if (asset = site.data.fetch('images', {})[source])
          node['src'] = base + asset['src']
          node['srcset'] = asset['sizes'].map { |size| "#{base}#{size['src']} #{size['width']}w" }.join(', ')
          node['sizes'] = '(max-width: 760px) 100vw, 800px'
          node['width'], node['height'] = asset.values_at('width', 'height').map(&:to_s)
        elsif source.start_with?('/')
          node['src'] = base + source
        end
        captions = { '/assets/img/wefwefwefweff.png' => 'Competition screenshot from Tech Symposium 2026', '/assets/img/reportwrite1.png' => 'Report screenshot from the ITC 2026 competition' }
        node['alt'] = captions[source] if captions[source] && ['', 'alt text'].include?(node['alt'])
        node['loading'], node['decoding'] = 'lazy', 'async'
        if node.parent.name == 'p' && node.parent.text.strip.empty?
          node.parent.name = 'figure'
          caption = Nokogiri::XML::Node.new('figcaption', fragment)
          caption.content = node['alt']
          node.parent.add_child(caption)
        end
      end
      fragment.css('a[href^="/"]').each { |node| node['href'] = base + node['href'] }
      fragment.css('table').each do |node|
        wrapper = Nokogiri::XML::Node.new('div', fragment)
        wrapper['class'], wrapper['tabindex'], wrapper['role'], wrapper['aria-label'] = 'table-scroll', '0', 'region', 'Scrollable data table'
        node.replace(wrapper)
        wrapper.add_child(node)
      end
      fragment.to_html
    end
    def article_toc(input)
      headings = Nokogiri::HTML.fragment(input).css('h2[id], h3[id]')
      return '' if headings.empty?
      links = headings.map { |node| "<li><a href=\"##{CGI.escapeHTML(node['id'])}\">#{CGI.escapeHTML(node.text)}</a></li>" }.join
      "<nav aria-label=\"On this page\"><p class=\"eyebrow\">ON THIS PAGE</p><ol>#{links}</ol></nav>"
    end
  end
end
Liquid::Template.register_filter(Portfolio::Filters)
