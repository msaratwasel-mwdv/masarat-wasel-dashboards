<?php
$path = "c:\\Users\\ASUS\\StudioProjects\\msaratwasel-services\\lib\\features\\driver\\route\\presentation\\screens\\route_navigation_screen.dart";
$content = file_get_contents($path);

// Add ReverbService member
$content = str_replace(
    "  Timer? _locationTimer;",
    "  ReverbService? _reverbService;\n  Timer? _locationTimer;",
    $content
);

// Add initialization to initState
$init_state = <<<EOD
  @override
  void initState() {
    super.initState();
    gmaps.DirectionsService.init("AIzaSyA2ZcFQqhauhU3l-Rj36fbRYomIO7L-ahs");
    _fetchRouteData();
    _startRealGPS();
    _initReverb();
  }

  Future<void> _initReverb() async {
    final busId = GetIt.instance<SharedPreferences>().getString('USER_BUS_ID') ?? '';
    if (busId.isNotEmpty) {
      _reverbService = ReverbService(
        dio: ApiClient.instance,
        onStudentLocationUpdated: (data) {
          debugPrint("REVERB: Student location updated, refreshing route data...");
          _fetchRouteData();
        }
      );
      _reverbService!.connect();
      _reverbService!.subscribe('private-bus.\$busId');
    }
  }
EOD;

$content = preg_replace(
    '/  @override\s+void initState\(\) \{\s+super\.initState\(\);\s+gmaps\.DirectionsService\.init\("[^"]+"\);\s+_fetchRouteData\(\);\s+_startRealGPS\(\);\s+\}/m',
    $init_state,
    $content
);

// Add dispose
$dispose = <<<EOD
  @override
  void dispose() {
    _reverbService?.dispose();
    _locationTimer?.cancel();
    _waitingTimer?.cancel();
    super.dispose();
  }
EOD;

$content = preg_replace(
    '/  @override\s+void dispose\(\) \{\s+_locationTimer\?\.cancel\(\);\s+_waitingTimer\?\.cancel\(\);\s+super\.dispose\(\);\s+\}/m',
    $dispose,
    $content
);

file_put_contents($path, $content);
echo "Replaced successfully";
