require 'jekyll'
require 'json'
require_relative '../_plugins/portfolio'

site = Jekyll::Site.new(Jekyll.configuration('source' => File.expand_path('..', __dir__), 'baseurl' => '/preview', 'quiet' => true))
site.data['images'] = JSON.parse(File.read('_data/images.json'))
filter = Object.new.extend(Portfolio::Filters)
{ 1 => '01', 9 => '09', 10 => '10', 99 => '99', 100 => '100', 1234 => '1234' }.each do |value, expected|
  raise "Truncated milestone number #{value}" unless filter.entry_number(value) == expected
end
filter.instance_variable_set(:@context, Liquid::Context.new({}, {}, { site: site }))
markdown = <<~MARKDOWN
  # Example section

  [Internal reference](/about/)

  ```ruby
  puts 'hello'
  ```

  | Topic | Note |
  | --- | --- |
  | Networking | Foundation |

  > A useful observation.

  ![alt text](/assets/img/reportwrite1.png)
MARKDOWN
html = filter.article_html(site.find_converter_instance(Jekyll::Converters::Markdown).convert(markdown))
doc = Nokogiri::HTML.fragment(html)
checks = {
  'source headings demoted without losing anchors' => doc.css('h1').empty? && doc.at_css('h2#example-section'),
  'static TOC anchors' => filter.article_toc(html).include?('href="#example-section"'),
  'Rouge syntax markup' => doc.at_css('.highlight span'),
  'keyboard-accessible responsive table region' => doc.at_css('.table-scroll[tabindex="0"][role="region"] table'),
  'callout content' => doc.at_css('blockquote p')&.text&.include?('useful observation'),
  'image caption' => doc.at_css('figcaption')&.text == 'Report screenshot from the ITC 2026 competition',
  'responsive image dimensions and prefix' => doc.at_css('img[width][height][srcset]')&.[]('src')&.start_with?('/preview/assets/media/'),
  'internal link prefix' => doc.at_css('a')&.[]('href') == '/preview/about/',
  'case-folded taxonomy routes' => filter.slug_path('/tags/BlueTeam') == '/tags/blueteam/'
}
failed = checks.select { |_name, passed| !passed }.keys
abort "FAIL: #{failed.join(', ')}" unless failed.empty?
puts "PASS: #{checks.size} article rendering and taxonomy contracts."
