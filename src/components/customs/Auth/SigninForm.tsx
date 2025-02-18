import Image from "next/image";
import { GithubIcon } from "lucide-react";
import SigninButton from "./SigninButton";
import SigninWithEmailForm from "./SigninWithEmailForm";
import { Divider } from "@heroui/react";

type IntlProps = {
  SignInWithGoogleIntl: string;
  SignInWithGitHubIntl: string;
  SignInWithDiscordIntl: string;
  SigninWithEmailIntl: string;
  EnterYourEmailIntl: string;
  MagicLinkIntl: string;
  EmailSigninLabelIntl: string;
  InvalidEmailIntl: string;
}

export default function SigninForm({
  SignInWithGoogleIntl,
  SignInWithGitHubIntl,
  SignInWithDiscordIntl,
  SigninWithEmailIntl,
  EnterYourEmailIntl,
  MagicLinkIntl,
  EmailSigninLabelIntl,
  InvalidEmailIntl,
}: IntlProps) {
  return (
    <div

      className="flex flex-col gap-2 w-11/12 sm:w-full max-w-xl shadow-md bg-content1 backdrop-saturate-150 p-6 sm:p-12 rounded-sm"
    >
      <SigninButton provider="google" IntlMessage={SignInWithGoogleIntl} startContent={<Image src={"/svg/providers/google.svg"} width={24} height={24} alt="google-icon" />} />
      <SigninButton provider="discord" IntlMessage={SignInWithDiscordIntl} startContent={<Image src={"/svg/providers/discord-blue.svg"} width={24} height={24} alt="discord-icon" />} />
      <SigninButton provider="github" IntlMessage={SignInWithGitHubIntl} startContent={<GithubIcon className="text-foreground" size={24} />} />
      <Divider></Divider>
      <SigninWithEmailForm SigninWithEmailIntl={SigninWithEmailIntl} EnterYourEmailIntl={EnterYourEmailIntl} EmailSigninLabelIntl={EmailSigninLabelIntl} MagicLinkIntl={MagicLinkIntl} InvalidEmailIntl={InvalidEmailIntl} />
    </div>
  );
}
