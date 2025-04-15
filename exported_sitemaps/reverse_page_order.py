import json
import copy


def reverse_page_order(site_map_data):
    """
    Reverses the order of pages in the site map data structure

    Args:
        site_map_data (dict): The original site map data object

    Returns:
        dict: A new site map with pages in reversed order
    """
    # Create a deep copy to avoid mutating the original data
    data_copy = copy.deepcopy(site_map_data)

    # Get all page keys and reverse their order
    page_keys = list(data_copy["pages"].keys())
    page_keys.reverse()

    # Create a new pages dictionary with the reversed order
    reversed_pages = {}
    for key in page_keys:
        reversed_pages[key] = data_copy["pages"][key]

    # Update the copy with reversed pages
    data_copy["pages"] = reversed_pages

    return data_copy


# Example usage
if __name__ == "__main__":
    # Load the site map from file
    with open("exported_sitemaps/pismo/pismo-sitemap-full.json", "r") as f:
        site_map = json.load(f)

    # Create a reversed version
    reversed_site_map = reverse_page_order(site_map)

    # The pages will now be in order: Home, About, Blog, Explore, Stay, FAQ, Contact
    print("Original page order:", list(site_map["pages"].keys()))
    print("Reversed page order:", list(reversed_site_map["pages"].keys()))

    # Optionally save the reversed site map to a new file
    with open("exported_sitemaps/pismo/pismo-sitemap-reversed.json", "w") as f:
        json.dump(reversed_site_map, f, indent=2)
