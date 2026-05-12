import { AfterViewInit, Component, ElementRef, OnDestroy, OnInit, ViewChild } from '@angular/core';
import * as L from 'leaflet';
import { GeolocationService, Coords } from '../../../core/services/geolocation.service';
import { ParkingLotService } from '../../../core/services/parking-lot.service';
import { NearbyParkingLot } from '../../../core/models/api-models';
import { Router } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-nearby-lots',
  templateUrl: './nearby-lots.component.html',
  styleUrls: ['../../../shared/dashboard-shared.scss', './nearby-lots.component.scss']
})
export class NearbyLotsComponent implements OnInit, AfterViewInit, OnDestroy {
  @ViewChild('mapEl', { static: true }) mapEl!: ElementRef<HTMLDivElement>;

  coords: Coords | null = null;
  lots: NearbyParkingLot[] = [];
  loading = true;
  error = '';
  hoveredId: number | null = null;

  // Filter state
  filter: 'ALL' | 'OPEN' | 'NEARBY' = 'ALL';

  private map?: L.Map;
  private markers = new Map<number, L.Marker>();
  private userMarker?: L.CircleMarker;

  constructor(
    private geo: GeolocationService,
    private lots$: ParkingLotService,
    public auth: AuthService,
    private router: Router
  ) {}

  ngOnInit(): void {}

  async ngAfterViewInit(): Promise<void> {
    this.coords = await this.geo.getPosition();
    this.initMap(this.coords);
    this.fetchNearby();
  }

  ngOnDestroy(): void {
    this.map?.remove();
  }

  private initMap(c: Coords): void {
    this.map = L.map(this.mapEl.nativeElement, {
      center: [c.lat, c.lng],
      zoom: 13,
      zoomControl: true,
      attributionControl: true
    });

    // CARTO Voyager dark — free + no API key, fits the aesthetic
    L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a> &copy; <a href="https://carto.com/attributions">CARTO</a>',
      maxZoom: 19
    }).addTo(this.map);

    // User position
    this.userMarker = L.circleMarker([c.lat, c.lng], {
      radius: 10,
      fillColor: '#5eead4',
      color: '#5eead4',
      weight: 3,
      opacity: 1,
      fillOpacity: 0.6
    }).addTo(this.map).bindPopup('<b>You are here</b>');
  }

  private fetchNearby(): void {
    if (!this.coords) return;
    this.loading = true;
    this.lots$.nearby(this.coords.lat, this.coords.lng).subscribe({
      next: lots => {
        this.lots = lots || [];
        this.placeMarkers();
        this.loading = false;
      },
      error: err => {
        this.loading = false;
        this.error = err.status === 0
          ? 'Cannot reach the gateway. Make sure your backend is running on localhost:5000.'
          : 'Could not load nearby lots.';
      }
    });
  }

  private placeMarkers(): void {
    if (!this.map) return;
    this.markers.forEach(m => m.remove());
    this.markers.clear();

    this.lots.forEach(lot => {
      const color = !lot.isOpen ? '#ff5d73'
        : lot.availableSpots === 0 ? '#ff5d73'
        : lot.availableSpots < 5 ? '#ffd84d'
        : '#c6ff4d';

      const icon = L.divIcon({
        className: 'pe-marker',
        iconSize: [32, 40],
        iconAnchor: [16, 40],
        html: `
          <div class="pe-pin" style="--c:${color}">
            <span class="pe-pin-count">${lot.availableSpots}</span>
          </div>
        `
      });

      const marker = L.marker([lot.latitude, lot.longitude], { icon })
        .addTo(this.map!)
        .bindPopup(`
          <div style="font-family:'IBM Plex Sans',sans-serif;color:#f4ecd8;min-width:180px">
            <div style="font-family:Fraunces,serif;font-weight:600;font-size:1.05rem;margin-bottom:4px">${lot.name}</div>
            <div style="font-size:.75rem;color:#8a9bc0;margin-bottom:10px">${lot.address}, ${lot.city}</div>
            <div style="font-family:'JetBrains Mono',monospace;font-size:.7rem;color:#ffd84d">
              ${lot.availableSpots} / ${lot.totalSpots} open · ${lot.distanceKm.toFixed(1)} km
            </div>
          </div>
        `);

      marker.on('click', () => {
        this.router.navigate(['/driver/lots', lot.id]);
      });

      this.markers.set(lot.id, marker);
    });
  }

  focusLot(lot: NearbyParkingLot): void {
    if (!this.map) return;
    this.map.flyTo([lot.latitude, lot.longitude], 17, { duration: 0.6 });
    this.markers.get(lot.id)?.openPopup();
    this.hoveredId = lot.id;
  }

  open(lot: NearbyParkingLot): void {
    this.router.navigate(['/driver/lots', lot.id]);
  }

  get filtered(): NearbyParkingLot[] {
    switch (this.filter) {
      case 'OPEN': return this.lots.filter(l => l.isOpen && l.availableSpots > 0);
      case 'NEARBY': return [...this.lots].sort((a, b) => a.distanceKm - b.distanceKm).slice(0, 10);
      default: return this.lots;
    }
  }

  availabilityClass(lot: NearbyParkingLot): string {
    if (!lot.isOpen) return 'rose';
    if (lot.availableSpots === 0) return 'rose';
    if (lot.availableSpots < 5) return 'amber';
    return 'lime';
  }
}
