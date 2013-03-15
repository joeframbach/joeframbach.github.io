var disqus_shortname = 'joeframbach';
$(function() {
  $('.load-comments').click(function() {
    var loader = this;
    $('#disqus_thread').remove();
    $(loader).after($('<div id="disqus_thread"></div>'));
    DISQUS.reset({
      reload: true,
      config: function () {
        this.page.identifier = $(loader).data('shortname');
        this.page.url = "http://example.com/#!"+$(loader).data('shortname');
      }
    });
    $('.load-comments').not($(loader)).show();
    $(loader).hide();
  });
  $('.load-more').click(function() {
    $(this).closest('.post').css({'max-height':'auto'});
  });
});

