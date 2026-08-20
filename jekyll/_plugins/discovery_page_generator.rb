# frozen_string_literal: true

# Generates the Find Your Workshop discovery landing pages at /workshops/{slug}/
# from structured data, so cities, audiences, workshops, and group types can be
# added or edited without touching templates:
#
#   _data/discovery/cities.yml       -> /locations/boston/, ...
#   _data/discovery/audiences.yml    -> /workshops/high-school/, ...
#   _data/discovery/group_types.yml  -> /workshops/educational-tours/, ...
#   _data/workshops.yml (landing_*)  -> /workshops/robotics/, ...
#
# Each page renders with _layouts/discovery.html and receives a normalized
# `entry` hash so the layout can treat every category uniformly.

module StageOne
  class DiscoveryPage < Jekyll::Page
    SITE_URL = "https://stageoneeducation.com"

    def initialize(site, category, url_slug, entry)
      @site = site
      @base = site.source
      base_dir = category == "city" ? "locations" : "workshops"
      @dir = File.join(base_dir, url_slug)
      @name = "index.html"
      process(@name)

      @data = {
        "layout" => "discovery",
        "title" => entry["seo_title"],
        "description" => entry["seo_description"],
        "canonical" => "#{SITE_URL}/#{base_dir}/#{url_slug}/",
        "i18n" => true,
        "i18n_key" => "discovery",
        "discovery_category" => category,
        "discovery_slug" => url_slug,
        "entry" => entry
      }
    end
  end

  class DiscoveryPageGenerator < Jekyll::Generator
    safe true
    priority :normal

    def generate(site)
      hydrate_existing_pages(site)
      existing = existing_discovery_keys(site)
      discovery = site.data["discovery"] || {}

      (discovery["cities"] || [])
        .reject { |city| city["active"] == false }
        .sort_by { |city| city["name"].to_s }
        .each do |city|
        next if existing.include?(["city", city["slug"]])

        site.pages << DiscoveryPage.new(site, "city", city["slug"], city_entry(city))
      end

      (discovery["audiences"] || []).each do |audience|
        next if existing.include?(["audience", audience["id"]])

        site.pages << DiscoveryPage.new(site, "audience", audience["id"], simple_entry(audience))
      end

      (discovery["group_types"] || []).each do |group|
        next if existing.include?(["group_type", group["id"]])

        site.pages << DiscoveryPage.new(site, "group_type", group["id"], simple_entry(group))
      end

      (site.data["workshops"] || []).each do |workshop|
        next unless workshop["landing_slug"]
        next if existing.include?(["workshop", workshop["landing_slug"]])

        site.pages << DiscoveryPage.new(site, "workshop", workshop["landing_slug"], workshop_entry(workshop))
      end
    end

    private

    def existing_discovery_keys(site)
      site.pages.filter_map do |page|
        category = page.data["discovery_category"]
        slug = page.data["discovery_slug"]
        [category, slug] if category && slug
      end
    end

    def hydrate_existing_pages(site)
      site.pages.each do |page|
        category = page.data["discovery_category"]
        slug = page.data["discovery_slug"]
        next unless category && slug

        entry = entry_for(site, category, slug)
        next unless entry

        page.data["entry"] = entry
        page.data["title"] ||= entry["seo_title"]
        page.data["description"] ||= entry["seo_description"]
        page.data["canonical"] ||= "https://stageoneeducation.com/#{dir_for(category)}/#{slug}/"
        page.data["i18n"] = true
        page.data["i18n_key"] ||= "discovery"
      end
    end

    def dir_for(category)
      category == "city" ? "locations" : "workshops"
    end

    def entry_for(site, category, slug)
      discovery = site.data["discovery"] || {}
      case category
      when "city"
        city = (discovery["cities"] || []).find { |item| item["slug"] == slug }
        city ? city_entry(city) : nil
      when "audience"
        audience = (discovery["audiences"] || []).find { |item| item["id"] == slug }
        audience ? simple_entry(audience) : nil
      when "group_type"
        group = (discovery["group_types"] || []).find { |item| item["id"] == slug }
        group ? simple_entry(group) : nil
      when "workshop"
        workshop = (site.data["workshops"] || []).find { |item| item["landing_slug"] == slug }
        workshop ? workshop_entry(workshop) : nil
      end
    end

    def city_entry(city)
      base_entry(city).merge(
        "name" => city["name"],
        "short_label" => city["short_label"] || city["name"],
        "context_id" => city["slug"],
        "facts" => city["city_facts"] || [],
        "visual" => city["visual"] || "default",
        "landmark_image" => city["landmark_image"]
      )
    end

    # Audiences and group types share the same field shape.
    def simple_entry(item)
      base_entry(item).merge(
        "name" => item["label"],
        "short_label" => item["short_label"] || item["label"],
        "context_id" => item["id"],
        "facts" => item["facts"] || []
      )
    end

    def workshop_entry(workshop)
      {
        "name" => workshop["heading_label"] || workshop["name"],
        "short_label" => workshop["explorer_label"] || workshop["name"],
        "context_id" => workshop["slug"],
        "headline" => workshop["landing_headline"],
        "intro" => workshop["landing_intro"],
        "supporting_copy" => workshop["landing_supporting_copy"] || [],
        "facts" => workshop["landing_facts"] || [],
        "cta_heading" => workshop["landing_cta_heading"],
        "cta_copy" => workshop["landing_cta_copy"],
        "seo_title" => workshop["landing_seo_title"],
        "seo_description" => workshop["landing_seo_description"],
        "detail_path" => workshop["detail_path"],
        "duration" => workshop["duration"]
      }
    end

    def base_entry(item)
      {
        "headline" => item["headline"],
        "intro" => item["intro"],
        "supporting_copy" => item["supporting_copy"] || [],
        "cta_heading" => item["cta_heading"],
        "cta_copy" => item["cta_copy"],
        "seo_title" => item["seo_title"],
        "seo_description" => item["seo_description"]
      }
    end
  end
end

Jekyll::Hooks.register :pages, :pre_render do |page|
  next unless page.data["discovery_category"] && page.data["discovery_slug"]
  next unless page.site

  generator = StageOne::DiscoveryPageGenerator.new
  entry = generator.send(:entry_for, page.site, page.data["discovery_category"], page.data["discovery_slug"])
  next unless entry

  page.data["entry"] = entry
  page.data["title"] ||= entry["seo_title"]
  page.data["description"] ||= entry["seo_description"]
end
