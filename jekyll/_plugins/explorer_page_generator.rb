# frozen_string_literal: true

# The combinatorial /explore/{category}/{slug}/ pages have been replaced by
# region-led landing pages. Redirects in firebase.json preserve old URLs.
# This file remains so existing deploy docs do not break; it no longer emits pages.

module StageOne
  class ExplorerPageGenerator < Jekyll::Generator
    safe true
    priority :low

    def generate(_site)
      # Intentionally empty.
    end
  end
end
