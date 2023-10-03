import * as React from "react";
import {
  Button,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Section,
  Tailwind,
  Text,
} from "@react-email/components";
export function PasswordResetEmail({
  name,
  link,
}: {
  name: string | null;
  link: string;
}) {
  return (
    <Html lang="en">
      <Head>
        <title>Reset Password</title>
      </Head>
      <Tailwind>
        <Container className="border border-solid border-[#eaeaea] rounded my-[40px] mx-auto p-[20px] w-[465px]">
          <Heading as="h1">{name && `Hi ${name},`}</Heading>
          <Text>
            {`Please click on the following link to reset your password`}
          </Text>
          <Text>
            <i>
              Please note that this link will expire in <strong>30 mins</strong>
              .
            </i>
          </Text>
          <Section className="text-center mt-[32px] mb-[32px]">
            <Button
              pX={20}
              pY={10}
              className="text-center text-white text-lg bg-[#7C3AED] rounded no-underline"
              href={link}
            >
              Reset Password
            </Button>
          </Section>
          <Hr className="border border-solid border-[#eaeaea] my-[26px] mx-0 w-full" />
          <Text>
            {`If you did not request this, please ignore this email and your password will remain unchanged.`}
          </Text>
          <Text>{`Thanks,`}</Text>
          <Text>
            <strong>{`Turkish Dictionary Team`}</strong>
          </Text>
        </Container>
      </Tailwind>
    </Html>
  );
}
