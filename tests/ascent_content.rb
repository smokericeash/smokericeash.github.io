# frozen_string_literal: true

require 'nokogiri'
require 'pathname'

root = Pathname.new(__dir__).parent
posts_dir = root.join('_posts', '2026')
created = []
build = lambda do
  ok = system({ 'JEKYLL_ENV' => 'production' }, 'bundle', 'exec', 'jekyll', 'build',
              chdir: root.to_s, out: File::NULL)
  raise 'Jekyll build failed during Ascent fixture test' unless ok
end
read_views = lambda do
  home = Nokogiri::HTML(root.join('_site', 'index.html').read)
  ascent = Nokogiri::HTML(root.join('_site', 'journey', 'index.html').read)
  [home, ascent]
end
assert = lambda do |condition, message|
  raise message unless condition
end
fixture = lambda do |name, title, date, excluded = false|
  path = posts_dir.join("2026-10-10-CODEX-ASCENT-#{name}.md")
  raise "Refusing to overwrite #{path}" if path.exist?
  path.write("---\ntitle: '#{title}'\ndate: #{date}\ncategories: [Project]\ndescription: Temporary Ascent fixture.\nascent: #{excluded ? 'false' : 'true'}\n---\n\nFixture content.\n")
  created << path
  path
end

begin
  build.call
  home, ascent = read_views.call
  original = home.css('.chronicle-entry').length
  assert.call(original == ascent.css('.expedition-checkpoint').length, 'Original views differ')

  first = fixture.call('A', 'Ascent fixture A', '2026-10-10 09:00:00 -0700')
  fixture.call('B', 'Ascent fixture B', '2026-10-10 09:00:00 -0700')
  fixture.call('EXCLUDED', 'Excluded fixture', '2026-10-10 09:00:00 -0700', true)
  build.call
  home, ascent = read_views.call
  assert.call(home.css('.chronicle-entry').length == original + 2, 'Home did not add same-date posts')
  assert.call(ascent.css('.expedition-checkpoint').length == original + 2, 'Expedition did not add same-date posts')
  assert.call(ascent.text.include?('Ascent fixture A') && ascent.text.include?('Ascent fixture B'), 'Added titles missing')
  assert.call(!ascent.css('.expedition-checkpoint').text.include?('Excluded fixture'), 'Excluded post became a milestone')

  first.write(first.read.sub('Ascent fixture A', 'Updated Ascent fixture A')
                   .sub('2026-10-10 09:00:00 -0700', '2025-09-20 09:00:00 -0700'))
  build.call
  home, ascent = read_views.call
  assert.call(home.css('.chronicle-entry').first.text.include?('Updated Ascent fixture A'), 'Date/title edit did not reorder Home')
  assert.call(ascent.css('.expedition-checkpoint').first.text.include?('Updated Ascent fixture A'), 'Date/title edit did not reorder expedition')

  20.times { |i| fixture.call(format('GROW-%02d', i), "Growth fixture #{i}", '2026-10-10 09:00:00 -0700') }
  build.call
  home, ascent = read_views.call
  assert.call(home.css('.chronicle-entry').length == original + 22, 'Home did not expand for many posts')
  assert.call(ascent.css('.expedition-checkpoint').length == original + 22, 'Expedition did not expand for many posts')

  created.last.unlink
  created.pop
  build.call
  home, ascent = read_views.call
  assert.call(home.css('.chronicle-entry').length == original + 21, 'Home did not remove a post')
  assert.call(ascent.css('.expedition-checkpoint').length == original + 21, 'Expedition did not remove a post')
  puts 'PASS: shared Ascent content grows, excludes, edits, reorders, and shrinks'
ensure
  created.each { |path| path.unlink if path.exist? }
  build.call
end
