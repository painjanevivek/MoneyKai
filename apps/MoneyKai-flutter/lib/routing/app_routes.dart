class AppRoutes {
  const AppRoutes._();

  static const splash = '/splash';
  static const signIn = '/auth/sign-in';
  static const dashboard = '/dashboard';
  static const transactions = '/transactions';
  static const addTransaction = '/transactions/add';
  static const editTransaction = '/transactions/edit/:id';
  static const budget = '/budget';
  static const insights = '/insights';
  static const settings = '/settings';
  static const privacy = '/privacy';
  static const localDiagnostics = '/settings/local-diagnostics';

  static String editTransactionPath(String id) => '/transactions/edit/$id';
}
