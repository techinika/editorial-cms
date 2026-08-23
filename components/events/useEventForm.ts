"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useToast } from "@/components/Toast";
import { generateSlug } from "@/lib/content-parser";
import { createEvent, getAllAuthorsWithRoles } from "@/supabase/CRUD/queries";
import { EventFormat, EventStatus } from "@/types/event";

export interface AuthorOption {
  id: string;
  name: string;
}

export type RegistrationType = "none" | "platform" | "external";

export function useEventForm() {
  const { showToast } = useToast();
  const router = useRouter();

  const [title, setTitle] = useState("");
  const [format, setFormat] = useState<string>("Conference");
  const [status, setStatus] = useState<string>("Upcoming");
  const [location, setLocation] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [organizer, setOrganizer] = useState<{ id: string; name: string } | null>(null);
  const [contactPersonId, setContactPersonId] = useState("");
  const [authors, setAuthors] = useState<AuthorOption[]>([]);
  const [tags, setTags] = useState("");
  const [registrationType, setRegistrationType] = useState<RegistrationType>("none");
  const [externalLink, setExternalLink] = useState("");
  const [seoDescription, setSeoDescription] = useState("");
  const [fullDescription, setFullDescription] = useState("");
  const [isFeatured, setIsFeatured] = useState(false);
  const [dateError, setDateError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    loadAuthors();
  }, []);

  const loadAuthors = async () => {
    const data = await getAllAuthorsWithRoles();
    setAuthors(data.map((a) => ({ id: a.id, name: a.name })));
  };

  const validateDates = (): boolean => {
    setDateError(null);
    if (startDate && endDate && new Date(endDate) < new Date(startDate)) {
      setDateError("End date/time cannot be before start date/time");
      return false;
    }
    return true;
  };

  const handleSave = async (publish: boolean) => {
    if (!title.trim()) {
      showToast("error", "Title is required");
      return;
    }
    if (!validateDates()) return;

    setIsSaving(true);
    try {
      const slug =
        generateSlug(title) + "-" + Date.now().toString(36);

      const created = await createEvent({
        title: title.trim(),
        slug,
        lang: "english",
        location: location.trim() || null,
        format: format as EventFormat,
        status: status as EventStatus,
        publish_status: publish ? "published" : "draft",
        start_date: startDate ? new Date(startDate).toISOString() : null,
        end_date: endDate ? new Date(endDate).toISOString() : null,
        seo_description: seoDescription.trim() || null,
        full_description: fullDescription.trim() || null,
        tags: tags.trim() || null,
        external_link:
          registrationType === "platform"
            ? "register"
            : registrationType === "external"
              ? externalLink.trim() || null
              : null,
        organizer_id: organizer?.id || null,
        contact_person_id: contactPersonId || null,
        is_featured: isFeatured,
        views: 0,
      });

      if (!created) {
        showToast("error", "Failed to create event");
        return;
      }

      showToast(
        "success",
        `Event ${publish ? "published" : "saved as draft"}!`
      );
      router.push("/");
    } catch (err) {
      console.error("Error saving event:", err);
      showToast("error", "Failed to create event");
    } finally {
      setIsSaving(false);
    }
  };

  return {
    title,
    setTitle,
    format,
    setFormat,
    status,
    setStatus,
    location,
    setLocation,
    startDate,
    setStartDate,
    endDate,
    setEndDate,
    organizer,
    setOrganizer,
    contactPersonId,
    setContactPersonId,
    authors,
    tags,
    setTags,
    registrationType,
    setRegistrationType,
    externalLink,
    setExternalLink,
    seoDescription,
    setSeoDescription,
    fullDescription,
    setFullDescription,
    isFeatured,
    setIsFeatured,
    dateError,
    isSaving,
    handleSave,
  };
}
