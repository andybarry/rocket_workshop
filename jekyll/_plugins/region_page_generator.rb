# frozen_string_literal: true

# Region and international landing pages are authored as markdown files:
# jekyll/regions/*.md and jekyll/international-groups.md
# This generator is kept as a no-op so the build does not emit duplicate routes.

module StageOne
  class RegionPageGenerator < Jekyll::Generator
    safe true
    priority :low

    def generate(_site)
      # Intentionally empty.
    end
  end
end
