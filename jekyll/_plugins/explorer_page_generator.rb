# frozen_string_literal: true

require "set"

module StageOne
  class ExplorerPage < Jekyll::Page
    def initialize(site, base, dir, record)
      @site = site
      @base = base
      @dir = dir
      @name = "index.html"

      process(@name)
      self.content = ""
      self.data = {
        "layout" => "explore",
        "explorer" => record,
        "title" => "#{record.fetch('title')} | Stage One Education",
        "description" => record.fetch("description"),
        "i18n" => false
      }
    end
  end

  class ExplorerPageGenerator < Jekyll::Generator
    safe true
    priority :low

    def generate(site)
      workshops = site.data.fetch("workshops")
      locations = site.data.fetch("locations")
      content = site.data.fetch("explorer_content")
      groups = content.fetch("groups")
      regions = content.fetch("regions")
      workshop_pages = content.fetch("workshop_pages")
      special_locations = content.fetch("special_locations")

      validate!(workshops, locations, groups, regions, workshop_pages, special_locations)

      location_pages = locations.map do |location|
        location.merge(
          "category" => "location",
          "selected_label" => "Destination",
          "selected_value" => location.fetch("display_name"),
          "plan_params" => { "destination" => location.fetch("slug") }
        )
      end

      records = groups + regions + workshop_pages + location_pages + special_locations
      records.each do |record|
        dir = File.join("explore", record.fetch("category"), record.fetch("slug"))
        site.pages << ExplorerPage.new(site, site.source, dir, record)
      end
    end

    private

    def validate!(workshops, locations, groups, regions, workshop_pages, special_locations)
      workshop_slugs = unique_slugs!(workshops, "workshop")
      region_slugs = unique_slugs!(regions, "region")
      unique_slugs!(locations, "location")
      unique_slugs!(groups, "group")
      unique_slugs!(special_locations, "special location")

      featured_slugs = workshop_pages.map { |record| record.fetch("featured_workshop_id") }.to_set
      unless featured_slugs == workshop_slugs
        fail_build!("Workshop context pages must match the workshop catalog")
      end

      locations.each do |location|
        unless region_slugs.include?(location.fetch("region"))
          fail_build!("Location #{location.fetch('slug')} has an unknown region")
        end
      end

      all_route_keys = Set.new
      (groups + regions + workshop_pages + special_locations).each do |record|
        key = "#{record.fetch('category')}/#{record.fetch('slug')}"
        fail_build!("Duplicate explorer route #{key}") unless all_route_keys.add?(key)
        validate_record!(record)
      end

      locations.each do |location|
        key = "location/#{location.fetch('slug')}"
        fail_build!("Duplicate explorer route #{key}") unless all_route_keys.add?(key)
        %w[eyebrow title description display_name].each { |field| location.fetch(field) }
      end
    rescue KeyError => error
      fail_build!("Explorer data is missing #{error.key}")
    end

    def unique_slugs!(records, label)
      slugs = records.map { |record| record.fetch("slug") }
      fail_build!("Duplicate #{label} slug") unless slugs.length == slugs.uniq.length
      slugs.to_set
    end

    def validate_record!(record)
      %w[category slug eyebrow title description selected_label selected_value plan_params].each do |field|
        record.fetch(field)
      end
    end

    def fail_build!(message)
      raise Jekyll::Errors::FatalException, "Workshop Explorer: #{message}"
    end
  end
end
