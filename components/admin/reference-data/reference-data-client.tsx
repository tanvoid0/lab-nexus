"use client";

import type { AssetCategory, Location } from "@prisma/client";
import type { ReferenceLookupEntry } from "@/lib/types/reference-lookup";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faLayerGroup,
  faList,
  faLocationDot,
} from "@fortawesome/free-solid-svg-icons";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { CategoryCreateForm } from "@/components/admin/reference-data/category-create-form";
import { CategoryRow } from "@/components/admin/reference-data/category-row";
import { LocationCreateForm } from "@/components/admin/reference-data/location-create-form";
import { LocationRow } from "@/components/admin/reference-data/location-row";
import { LookupCreateForm } from "@/components/admin/reference-data/lookup-create-form";
import { LookupRow } from "@/components/admin/reference-data/lookup-row";

export function ReferenceDataClient(props: {
  categories: AssetCategory[];
  locations: Location[];
  conditionLookups: ReferenceLookupEntry[];
  operationalLookups: ReferenceLookupEntry[];
}) {
  const { categories, locations, conditionLookups, operationalLookups } = props;

  return (
    <div className="space-y-10">
      <Card className="border-border">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-primary">
            <FontAwesomeIcon icon={faLayerGroup} className="size-5" />
            Categories
          </CardTitle>
          <CardDescription>Used to group assets; cannot delete while assets reference a category.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <CategoryCreateForm />
          <ul className="divide-y divide-border rounded-md border border-border">
            {categories.length === 0 ? (
              <li className="p-4 text-sm text-muted-foreground">No categories yet.</li>
            ) : (
              categories.map((c) => <CategoryRow key={c.id} category={c} />)
            )}
          </ul>
        </CardContent>
      </Card>

      <Card className="border-border">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-primary">
            <FontAwesomeIcon icon={faLocationDot} className="size-5" />
            Locations
          </CardTitle>
          <CardDescription>Physical or logical places; cannot delete while assets reference a location.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <LocationCreateForm />
          <ul className="divide-y divide-border rounded-md border border-border">
            {locations.length === 0 ? (
              <li className="p-4 text-sm text-muted-foreground">No locations yet.</li>
            ) : (
              locations.map((l) => <LocationRow key={l.id} location={l} />)
            )}
          </ul>
        </CardContent>
      </Card>

      <Card className="border-border">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-primary">
            <FontAwesomeIcon icon={faList} className="size-5" />
            Asset condition
          </CardTitle>
          <CardDescription>
            Stable <strong>code</strong> for imports and data; editable <strong>label</strong> for the UI.
            Deactivate to hide from new assignments while keeping history on existing assets.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <LookupCreateForm domain="ASSET_CONDITION" />
          <ul className="space-y-0 rounded-md border border-border px-3">
            {conditionLookups.map((e) => (
              <LookupRow key={e.id} entry={e} />
            ))}
          </ul>
        </CardContent>
      </Card>

      <Card className="border-border">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-primary">
            <FontAwesomeIcon icon={faList} className="size-5" />
            Operational status
          </CardTitle>
          <CardDescription>
            Availability-style status on assets. Checkout must stay on an asset with code{" "}
            <code className="rounded bg-muted px-1">AVAILABLE</code> and open quantity.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <LookupCreateForm domain="ASSET_OPERATIONAL_STATUS" />
          <ul className="space-y-0 rounded-md border border-border px-3">
            {operationalLookups.map((e) => (
              <LookupRow key={e.id} entry={e} />
            ))}
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
