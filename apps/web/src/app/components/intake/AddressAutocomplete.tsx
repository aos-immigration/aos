"use client";

import { useEffect, useRef, useState } from "react";
import { Input } from "@/components/ui/input";
import { useLoadScript } from "@react-google-maps/api";
import usePlacesAutocomplete, {
  getGeocode,
  getLatLng,
} from "use-places-autocomplete";

const libraries: ("places")[] = ["places"];

type AddressComponents = {
  street: string;
  city: string;
  state: string;
  zip: string;
  country: string;
};

type AddressAutocompleteProps = {
  value: string;
  onChange: (value: string) => void;
  onSelect: (address: AddressComponents) => void;
  placeholder?: string;
  id?: string;
  "aria-invalid"?: boolean;
};

function parseAddressComponents(
  components: google.maps.GeocoderAddressComponent[]
): AddressComponents {
  const result: AddressComponents = {
    street: "",
    city: "",
    state: "",
    zip: "",
    country: "",
  };

  let streetNumber = "";
  let streetName = "";

  for (const component of components) {
    const types = component.types;

    if (types.includes("street_number")) {
      streetNumber = component.long_name;
    }
    if (types.includes("route")) {
      streetName = component.long_name;
    }
    if (types.includes("locality") || types.includes("sublocality")) {
      result.city = component.long_name;
    }
    if (types.includes("administrative_area_level_1")) {
      result.state = component.short_name;
    }
    if (types.includes("postal_code")) {
      result.zip = component.long_name;
    }
    if (types.includes("country")) {
      result.country = component.long_name;
    }
  }

  result.street = [streetNumber, streetName].filter(Boolean).join(" ");

  return result;
}

function AutocompleteInput({
  value,
  onChange,
  onSelect,
  placeholder = "Start typing address...",
  id,
  "aria-invalid": ariaInvalid,
}: AddressAutocompleteProps) {
  const [showSuggestions, setShowSuggestions] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);

  const {
    ready,
    suggestions: { status, data },
    setValue: setAutocompleteValue,
    clearSuggestions,
  } = usePlacesAutocomplete({
    requestOptions: {
      types: ["address"],
      componentRestrictions: { country: ["us", "ca", "mx"] },
    },
    debounce: 300,
  });

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    onChange(val);
    setAutocompleteValue(val);
    setShowSuggestions(true);
  };

  const handleSelect = async (description: string) => {
    setAutocompleteValue(description, false);
    clearSuggestions();
    setShowSuggestions(false);

    try {
      const results = await getGeocode({ address: description });
      if (results[0]) {
        const addressComponents = parseAddressComponents(
          results[0].address_components
        );
        onChange(addressComponents.street);
        onSelect(addressComponents);
      }
    } catch (error) {
      console.error("Error getting geocode:", error);
    }
  };

  return (
    <div ref={wrapperRef} className="relative">
      <Input
        id={id}
        value={value}
        onChange={handleInput}
        disabled={!ready}
        placeholder={ready ? placeholder : "Loading..."}
        aria-invalid={ariaInvalid}
        autoComplete="off"
      />
      {showSuggestions && status === "OK" && (
        <ul className="absolute z-50 mt-1 max-h-60 w-full overflow-auto rounded-md border border-zinc-200 bg-white py-1 shadow-lg dark:border-zinc-700 dark:bg-zinc-900">
          {data.map(({ place_id, description }) => (
            <li
              key={place_id}
              onClick={() => handleSelect(description)}
              className="cursor-pointer px-3 py-2 text-sm hover:bg-zinc-100 dark:hover:bg-zinc-800"
            >
              {description}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export function AddressAutocomplete(props: AddressAutocompleteProps) {
  const { isLoaded, loadError } = useLoadScript({
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_PLACES_API_KEY || "",
    libraries,
  });

  if (loadError) {
    return (
      <Input
        id={props.id}
        value={props.value}
        onChange={(e) => props.onChange(e.target.value)}
        placeholder={props.placeholder}
        aria-invalid={props["aria-invalid"]}
      />
    );
  }

  if (!isLoaded) {
    return (
      <Input
        id={props.id}
        disabled
        placeholder="Loading..."
        aria-invalid={props["aria-invalid"]}
      />
    );
  }

  return <AutocompleteInput {...props} />;
}
