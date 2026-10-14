# frozen_string_literal: true

# Search-only metadata: do not modify the discovery entry used by visible copy.
module StageOne
  class SearchMetadata < Jekyll::Generator
    safe true
    priority :lowest

    def generate(site)
      site.pages.each do |page|
        category = page.data['discovery_category']
        slug = page.data['discovery_slug']
        entry = page.data['entry'] || {}
        if category == 'city'
          place = entry['name']
          next if place.to_s.empty?
          location = slug == 'other-us-cities' ? 'Across the USA' : "in #{place}"
          page.data['title'] = "Hands-On STEM Workshops #{location} | Stage One Education"
          page.data['description'] = "Hands-on STEM activities #{location} for student, international and educational tour groups. AI, robotics and engineering workshops led by real engineers."
        elsif slug == 'educational-tours'
          page.data['title'] = 'STEM Activities for Educational Tour Groups | Stage One Education'
          page.data['description'] = 'Add hands-on STEM workshops led by real engineers to your U.S. tour itinerary. AI, robotics and mechanical engineering delivered to your group venue.'
        elsif ['international-groups', 'international-students'].include?(slug)
          audience = slug == 'international-groups' ? 'International Groups' : 'International Students'
          page.data['title'] = "USA STEM Workshops for #{audience} | Stage One Education"
          page.data['description'] = 'Hands-on STEM activities for international groups visiting the USA. Learn AI, robotics and mechanical engineering with real engineers at your group venue.'
        elsif page.url == '/locations/'
          page.data['title'] = 'STEM Workshop Locations for Student & Tour Groups | Stage One Education'
          page.data['description'] = 'Find hands-on STEM workshops led by real engineers in U.S. cities. Explore locations for student groups, international visitors and educational tours.'
        end

        # Only advertise canonical public marketing pages, not apps or access pages.
        marketing_urls = ['/', '/about.html', '/ai-workshop.html', '/robotics-workshop.html',
                          '/rocket-workshop.html', '/locations/', '/privacy.html', '/testimonials.html']
        eligible = ['city', 'audience', 'group_type'].include?(category) || marketing_urls.include?(page.url)
        excluded = page.url.match?(%r{(?:session|redirect|workshop-access|cad-tutorial|drone|ai-network)})
        redirect = page.content.include?('http-equiv="refresh"')
        canonical = page.data['canonical']
        own_url = "https://stageoneeducation.com#{page.url}"
        page.data['search_sitemap'] = eligible && !excluded && !redirect && (!canonical || canonical == own_url || canonical == page.url)
      end
    end
  end
end
