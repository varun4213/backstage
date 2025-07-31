import { SignInPage } from '@backstage/core-components';

export const MultiGuestSignIn = (props: any) => {
  return <SignInPage {...props} auto providers={['guest']} />;
};
