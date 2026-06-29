import 'package:shared_preferences/shared_preferences.dart';

class LocalStorageService {
  LocalStorageService(this._preferences);

  final SharedPreferences _preferences;

  static Future<LocalStorageService> create() async {
    final preferences = await SharedPreferences.getInstance();
    return LocalStorageService(preferences);
  }

  String? readString(String key) => _preferences.getString(key);

  Future<void> writeString(String key, String value) {
    return _preferences.setString(key, value);
  }

  Future<void> remove(String key) => _preferences.remove(key);
}
