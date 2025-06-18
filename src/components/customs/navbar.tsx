import {
  Navbar as NextuiNavbar,
  NavbarContent,
  NavbarItem,
  Button,
  Avatar,
  Link,
  Dropdown,
  DropdownItem,
  DropdownTrigger,
  DropdownMenu,
  NavbarBrand,
} from "@heroui/react";
import { Languages, Menu, Moon, Sparkle, Sparkles, Sun } from "lucide-react";
import { signIn, signOut } from "next-auth/react";
import { useTheme } from "next-themes";
import { useLocale } from "next-intl";
import { useParams, useSearchParams } from "next/navigation";
import { usePathname, Link as NextIntlLink } from "@/src/i18n/routing";
import { Session } from "next-auth";
import logo from "@/public/svg/navbar/logo.svg";
import Image from "next/image";
import { useSnapshot } from "valtio";
import { preferencesState, toggleBlur } from "@/src/store/preferences";
import { cn } from "@/lib/utils";
type NavbarProps = {
  session: Session | null;
  setIsSidebarOpen: React.Dispatch<React.SetStateAction<boolean>>;
} & Record<"TitleIntl" | "WordListIntl" | "SignInIntl" | "HomeIntl" | "ProfileIntl" | "SavedWordsIntl" | "MyRequestsIntl" | "SearchHistoryIntl" | "LogoutIntl" | "AnnouncementsIntl" | "ariaAvatar" | "ariaMenu" | "ariaLanguages" | "ariaSwitchTheme" | "ariaBlur", string>;

export default function Navbar({
  session,
  TitleIntl,
  WordListIntl,
  SignInIntl,
  HomeIntl,
  ProfileIntl,
  SavedWordsIntl,
  MyRequestsIntl,
  SearchHistoryIntl,
  LogoutIntl,
  AnnouncementsIntl,
  ariaAvatar,
  setIsSidebarOpen,
  ariaMenu,
  ariaLanguages,
  ariaSwitchTheme,
  ariaBlur,
}: NavbarProps) {
  const { theme, setTheme } = useTheme();
  const pathName = usePathname();
  const searchParams = useSearchParams();
  const locale = useLocale();
  const params = useParams();
  const isAuthPage = ["/signup", "/signin", "/forgot-password"].includes(
    pathName
  );
  const snap = useSnapshot(preferencesState);
  return (
    <NextuiNavbar
      className="bg-background-foreground/100 border-b border-border"
      maxWidth="xl"
      shouldHideOnScroll
      classNames={{
        item: [
          "relative",
          "flex",
          "h-full",
          "items-center",
          "data-[active=true]",
          "data-[active=true]:after:content-['']",
          "data-[active=true]:after:absolute",
          "data-[active=true]:after:bottom-0",
          "data-[active=true]:after:left-0",
          "data-[active=true]:after:right-0",
          "data-[active=true]:after:h-[2px]",
          "data-[active=true]:after:rounded-[2px]",
          "data-[active=true]:after:bg-primary",
        ],
        // wrapper: ["sm:px-0"]
      }}
    >
      <NavbarItem>
        <NavbarBrand>
          <NextIntlLink as={Link as any} href="/" className="hidden md:flex items-center gap-2">
            <Image src={logo} alt="Turkish Dictionary Logo" className="h-8 w-8" />
            <span className="text-fs-1 font-bold text-primary">{TitleIntl}</span>
          </NextIntlLink>
          <button className="md:hidden">
            <Menu aria-label={ariaMenu} className="h-7 w-7" onClick={() => setIsSidebarOpen(true)} />
          </button>
        </NavbarBrand>
      </NavbarItem>
      <NavbarContent justify="end" className="gap-4 md:gap-8">
        {session?.user.role === "admin" ? (
          <NavbarItem className="hidden md:flex" isActive={pathName === "/dashboard"}>
            <NextIntlLink href={"/dashboard"} className='flex items-center gap-2 hover:text-primary text-gray-900 dark:hover:text-primary dark:text-gray-50 hover:underline rounded-sm'>
              <span className={`text-nowrap`}>Dashboard</span>
            </NextIntlLink>
          </NavbarItem>
        ) : null}
        <NavbarItem className="hidden md:flex" isActive={pathName === "/word-list"}>
          <NextIntlLink href={"/word-list"} className='flex items-center gap-2 hover:text-primary text-gray-900 dark:hover:text-primary dark:text-gray-50 hover:underline rounded-sm'>
            <span className={`text-nowrap`}>{WordListIntl}</span>
          </NextIntlLink>
        </NavbarItem>
        <NavbarItem className="hidden md:flex" isActive={pathName === "/announcements"}>
          <NextIntlLink href={'/announcements'} as={Link as any} className='flex items-center gap-2 hover:text-primary text-gray-900 dark:hover:text-primary dark:text-gray-50 hover:underline rounded-sm'>
            <span className={`text-nowrap`}>{AnnouncementsIntl}</span>
          </NextIntlLink>
        </NavbarItem>
        <NavbarItem>
          {locale === "en" ? (
            <NextIntlLink
              className="w-full block"
              // @ts-ignore
              href={{
                pathname: pathName,
                query: searchParams.toString(),
                params: {
                  word: params.word as any,
                  id: params.id as any,
                  slug: params.slug as any,
                },
              }}
              locale="tr"
            >
              <span className="flex items-center gap-2">
                <Languages aria-label="languages icon" className="w-6 h-6" /> TR
              </span>
            </NextIntlLink>
          ) : (
            <NextIntlLink
              className="w-full block"
              // @ts-ignore
              href={{
                pathname: pathName,
                query: searchParams.toString(),
                params: {
                  word: params.word as any,
                  id: params.id as any,
                  slug: params.slug as any,
                },
              }}
              locale="en"
            >
              <span className="flex items-center gap-2">
                <Languages aria-label={ariaLanguages} className="w-6 h-6" /> EN
              </span>
            </NextIntlLink>
          )}
        </NavbarItem>
        <NavbarItem>
          {/* theme button */}
          <Button aria-label={ariaSwitchTheme} variant="light" isIconOnly onPress={() => setTheme(theme === "dark" ? "light" : "dark")}>
            <Sun className="h-[1.2rem] w-[1.2rem] rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
            <Moon className="absolute h-[1.2rem] w-[1.2rem] rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
          </Button>
        </NavbarItem>
        <NavbarItem>

          <Button className="md:hidden" size="sm" aria-label={ariaBlur} variant="light" isIconOnly onPress={toggleBlur}>
            <Sparkles className={cn("h-[1.2rem] w-[1.2rem] rotate-0 scale-100 transition-all", snap.isBlurEnabled ? "rotate-0 scale-100" : "rotate-90 scale-0")} />
            <Sparkle className={cn("absolute h-[1.2rem] w-[1.2rem] rotate-0 scale-100 transition-all", snap.isBlurEnabled ? "rotate-90 scale-0" : "rotate-0 scale-100")} />
          </Button>
          <Button className="hidden md:inline-flex" aria-label={ariaBlur} variant="light" isIconOnly onPress={toggleBlur}>
            <Sparkles className={cn("h-[1.2rem] w-[1.2rem] rotate-0 scale-100 transition-all", snap.isBlurEnabled ? "rotate-0 scale-100" : "rotate-90 scale-0")} />
            <Sparkle className={cn("absolute h-[1.2rem] w-[1.2rem] rotate-0 scale-100 transition-all", snap.isBlurEnabled ? "rotate-90 scale-0" : "rotate-0 scale-100")} />
          </Button>
        </NavbarItem>
        {!session?.user ? (
          <NavbarItem>
            <Button
              onPress={() => signIn()}
              aria-disabled={isAuthPage}
              isDisabled={isAuthPage}
              variant="shadow"
              color="primary"
              className="font-bold"
            >
              {SignInIntl}
            </Button>
          </NavbarItem>
        ) : (
          <>
            {/* <NavbarItem className="cursor-pointer"> */}
            <Dropdown classNames={{
              content: ["rounded-sm"],
            }}>
              <DropdownTrigger>
                <Button isIconOnly disableAnimation disableRipple
                  className="bg-transparent"
                  aria-label={ariaAvatar}
                >
                  <Avatar
                    showFallback
                    src={session.user.image ?? "https://images.unsplash.com/broken"}
                    size="sm"
                  />
                </Button>
              </DropdownTrigger>
              <DropdownMenu
                onAction={(key) => {
                  switch (key) {
                    case "sign-out":
                      signOut();
                      break;
                  }
                }}
              >
                <DropdownItem key={"profile"} className="rounded-sm">
                  <Link color="foreground" as={NextIntlLink} className="w-full" href={`/profile/${session.user.id}`}>
                    {ProfileIntl}
                  </Link>
                </DropdownItem>
                <DropdownItem key={"saved-words"} className="text-center rounded-sm">
                  <Link color="foreground" as={NextIntlLink} className="w-full" href="/saved-words">
                    {SavedWordsIntl}
                  </Link>
                </DropdownItem>
                <DropdownItem key={"requests"} className="text-center rounded-sm">
                  <Link color="foreground" as={NextIntlLink} className="w-full" href="/my-requests">
                    {MyRequestsIntl}
                  </Link>
                </DropdownItem>
                <DropdownItem key={"search-history"} className="text-center rounded-sm">
                  <Link color="foreground" as={NextIntlLink} className="w-full" href="/search-history">
                    {SearchHistoryIntl}
                  </Link>
                </DropdownItem>
                <DropdownItem
                  className="rounded-sm text-destructive"
                  key={"sign-out"}
                  color="danger"
                  onPress={() => signOut()}
                >
                  {LogoutIntl}
                </DropdownItem>
              </DropdownMenu>
            </Dropdown>
            {/* </NavbarItem> */}
          </>
        )}
      </NavbarContent>
    </NextuiNavbar>
  );
}