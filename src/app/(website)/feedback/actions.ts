"use server";

import { createServiceClient } from "@/lib/supabase/service";

type FavouriteCategory =
  | "drinks_chilled"
  | "drinks_hot"
  | "chati_idli"
  | "dosa"
  | "uthapam"
  | "dessert";

type SubmitFeedbackArgs = {
  foodRating: number;
  serviceRating: number;
  favouriteCategory: FavouriteCategory;
  feedback?: string;
};

function isValidRating(value: number) {
  return Number.isInteger(value) && value >= 1 && value <= 5;
}

export async function submitFeedback(
  args: SubmitFeedbackArgs,
): Promise<{
  success: boolean;
  error?: string;
}> {
  if (!isValidRating(args.foodRating)) {
    return {
      success: false,
      error: "Please rate the food.",
    };
  }

  if (!isValidRating(args.serviceRating)) {
    return {
      success: false,
      error: "Please rate our service.",
    };
  }

  const validCategories: FavouriteCategory[] = [
    "drinks_chilled",
    "drinks_hot",
    "chati_idli",
    "dosa",
    "uthapam",
    "dessert",
  ];

  if (!validCategories.includes(args.favouriteCategory)) {
    return {
      success: false,
      error: "Please select your favourite category.",
    };
  }

  const supabase = createServiceClient();

  const { error } = await supabase.from("feedback").insert({
    food_quality_rating: args.foodRating,
    service_speed_rating: args.serviceRating,

    // Reusing the existing fields so we don't need
    // to change the database schema yet.
    dishes_ordered: args.favouriteCategory,
    standout_feedback: args.feedback?.trim() || null,
  });

  if (error) {
    console.error("Feedback insert failed:", error);

    return {
      success: false,
      error: "Something went wrong — please try again.",
    };
  }

  return {
    success: true,
  };
}