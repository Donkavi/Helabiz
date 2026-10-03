import type { TourStep } from "../tours";

export const steps: TourStep[] = [
  {
    text: {
      en: {
        title: "Your website's address",
        body: "This is where your shop's web address lives — the free Helabiz one, and your own domain name later on.",
      },
      si: {
        title: "ඔබේ website එකේ ලිපිනය",
        body: "සාප්පුවේ web ලිපිනය තියෙන්නේ මෙතන — නොමිලේ ලැබෙන Helabiz ලිපිනය, පස්සේ ඔබේම domain එකත්.",
      },
    },
  },
  {
    target: "website-domains-free",
    text: {
      en: {
        title: "Your free address",
        body: "Free on every plan and already working. Share it anywhere today. You can change the name part in Settings.",
      },
      si: {
        title: "නොමිලේ ලැබෙන ලිපිනය",
        body: "හැම plan එකකම නොමිලේ, දැනටමත් වැඩ. අදම ඕනම තැනක share කරන්න. ලිපිනයේ නම කොටස සැකසුම් වලින් වෙනස් කරන්න පුළුවන්.",
      },
    },
  },
  {
    target: "website-domains-add",
    text: {
      en: {
        title: "Your own domain",
        body: "On the Business plan, type a domain you already own, like kavifashion.lk, and press Add domain. We show you the DNS records to add.",
      },
      si: {
        title: "ඔබේම domain එක",
        body: "Business plan එකේ නම්, ඔබ දැනටමත් ගත්ත kavifashion.lk වගේ domain එකක් type කරලා Add domain ඔබන්න. දාන්න ඕන DNS records අපි පෙන්නනවා.",
      },
    },
  },
  {
    target: "website-domains-list",
    text: {
      en: {
        title: "Records to copy",
        body: "Copy the CNAME and TXT records into your registrar's DNS settings. Your free address keeps working the whole time.",
      },
      si: {
        title: "Copy කරන්න ඕන records",
        body: "CNAME සහ TXT records ඔබ domain එක ගත්ත තැනේ DNS settings වලට copy කරන්න. ඒ අතරෙත් ඔබේ නොමිලේ ලැබෙන ලිපිනය වැඩ කරනවා.",
      },
    },
  },
  {
    target: "website-domains-help",
    text: {
      en: {
        title: "Still being finished",
        body: "Automatic checking and HTTPS for your own domain are coming later, so added domains stay Pending for now. Your free address works fully today.",
      },
      si: {
        title: "තාම හදමින් තියෙන්නේ",
        body: "ඔබේම domain එක check කරන එකයි HTTPS දෙන එකයි ඉස්සරහට එනවා. ඒ නිසා දැනට එකතු කරන domain Pending විදිහටම තියෙයි. නොමිලේ ලැබෙන ලිපිනය අදම සම්පූර්ණයෙන් වැඩ.",
      },
    },
  },
];
