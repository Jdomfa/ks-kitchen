'use server';

import {
  createServiceClient,
} from '@/lib/supabase/service';

type Recommendation =
  | 'definitely'
  | 'probably'
  | 'unlikely'
  | 'no';

type SubmitFeedbackArgs = {
  foodQuality: number;

  menuVariety: number;

  serviceSpeed: number;

  staffFriendliness: number;

  cleanlinessAtmosphere: number;

  valueForMoney: number;

  dishesOrdered?: string;

  standoutFeedback?: string;

  recommendation: Recommendation;

  name?: string;

  email?: string;

  phone?: string;

  mayContact?: boolean | null;
};

function isValidRating(
  value: number
) {
  return (
    Number.isInteger(value) &&
    value >= 1 &&
    value <= 5
  );
}

export async function submitFeedback(
  args: SubmitFeedbackArgs
): Promise<{
  success: boolean;
  error?: string;
}> {
  const ratings = [
    args.foodQuality,
    args.menuVariety,
    args.serviceSpeed,
    args.staffFriendliness,
    args.cleanlinessAtmosphere,
    args.valueForMoney,
  ];

  if (
    !ratings.every(
      isValidRating
    )
  ) {
    return {
      success: false,
      error:
        'Please rate all dining experience categories.',
    };
  }

  if (
    ![
      'definitely',
      'probably',
      'unlikely',
      'no',
    ].includes(
      args.recommendation
    )
  ) {
    return {
      success: false,
      error:
        'Please select whether you would recommend us.',
    };
  }

  const supabase =
    createServiceClient();

  const {
    error,
  } =
    await supabase
      .from('feedback')
      .insert({
        food_quality_rating:
          args.foodQuality,

        menu_variety_rating:
          args.menuVariety,

        service_speed_rating:
          args.serviceSpeed,

        staff_friendliness_rating:
          args.staffFriendliness,

        cleanliness_atmosphere_rating:
          args.cleanlinessAtmosphere,

        value_for_money_rating:
          args.valueForMoney,

        dishes_ordered:
          args.dishesOrdered ||
          null,

        standout_feedback:
          args.standoutFeedback ||
          null,

        recommendation:
          args.recommendation,

        customer_name:
          args.name ||
          null,

        customer_email:
          args.email ||
          null,

        customer_phone:
          args.phone ||
          null,

        may_contact:
          args.mayContact,
      });

  if (error) {
    console.error(
      'Feedback insert failed:',
      error
    );

    return {
      success: false,
      error:
        'Something went wrong — please try again.',
    };
  }

  return {
    success: true,
  };
}