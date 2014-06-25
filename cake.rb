require 'chunky_png'
require 'optparse'

class Cake
  attr_accessor :debug

  def initialize(file)
    @image = ChunkyPNG::Image.from_file(file)
  end

  def crop_and_scale(new_width = 100, new_height = 100)
    width, height = @image.width, @image.height

    if width > height
      width = height
    else
      height = width
    end

    result = crop(width, height)
    result.resample_bilinear!(new_width, new_height) unless debug
    result
  end

  def crop(crop_width = 100, crop_height = 100)
    x, y, width, height = 0, 0, @image.width, @image.height
    slice_length = 16

    while (width - x) > crop_width
      slice_width = [width - x - crop_width, slice_length].min

      left = @image.crop(x, 0, slice_width, @image.height)
      right = @image.crop(width - slice_width, 0, slice_width, @image.height)

      if entropy(left) < entropy(right)
        x += slice_width
      else
        width -= slice_width
      end
    end

    while (height - y) > crop_height
      slice_height = [height - y - crop_height, slice_length].min

      top = @image.crop(0, y, @image.width, slice_height)
      bottom = @image.crop(0, height - slice_height, @image.width, slice_height)

      if entropy(top) < entropy(bottom)
        y += slice_height
      else
        height -= slice_height
      end
    end

    if debug
      return @image.rect(x, y, x + crop_width, y + crop_height, ChunkyPNG::Color::WHITE)
    end

    @image.crop(x, y, crop_width, crop_height)
  end

  private

  def histogram(image)
    hist = Hash.new(0)

    image.height.times do |y|
      image.width.times do |x|
        hist[image[x,y]] += 1
      end
    end

    hist
  end

  # http://www.mathworks.com/help/toolbox/images/ref/entropy.html
  def entropy(image)
    hist = histogram(image.grayscale)
    area = image.area.to_f

    -hist.values.reduce(0.0) do |e, freq|
      p = freq / area
      e + p * Math.log2(p)
    end
  end
end

options = { :width => 100, :height => 100 }

option_parser = OptionParser.new do |opts|
  opts.banner = "Usage: #{__FILE__} [options] <input ...>"

  opts.on('-o', '--output <string>',
          'Specify output file') do |filename|
    options[:output] = filename
  end

  opts.on('-s', '--smart',
          'Selects the largest, optimal square to crop and then resamples. Good for thumbnails.') do
    options[:smart] = true
  end

  opts.on(nil, '--debug',
          'Draws the bounding crop area instead of cropping the image') do
    options[:debug] = true
  end

  opts.on('-d', '--dimensions <integer>x<integer>',
          'Specify output dimensions (width x height) in pixels') do |dim|
    options[:width], options[:height] = dim.split('x').map(&:to_i)
  end
end

option_parser.parse!

if ARGV.empty?
  puts option_parser.help
  exit 1
end

ARGV.each_with_index do |file, i|
  c = Cake.new(file)
  c.debug = true if options[:debug]

  output = if options[:output]
             suffix = "_#{i}" if ARGV.size > 1
             "#{File.basename(options[:output], '.png')}#{suffix}.png"
           else
             "#{File.basename(file, '.png')}_cropped.png"
           end

  if options[:smart]
    c.crop_and_scale(options[:width], options[:height]).save(output)
  else
    c.crop(options[:width], options[:height]).save(output)
  end
end

