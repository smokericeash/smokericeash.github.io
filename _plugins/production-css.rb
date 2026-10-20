# Keep the editable styles modular; compress only the published copies.
# Sass ships with Jekyll. CSS syntax mode preserves native CSS functions/variables.
require 'sass-embedded'

Jekyll::Hooks.register :site, :post_write do |site|
  next unless Jekyll.env == 'production'

  site.static_files.each do |asset|
    next unless asset.relative_path.start_with?('/assets/css/') && asset.extname == '.css'

    result = Sass.compile_string(File.read(asset.path, encoding: 'utf-8'), syntax: :css, style: :compressed)
    File.write(asset.destination(site.dest), result.css)
  end
end
