import { Component, OnInit, OnDestroy } from '@angular/core';
import { interval, Subscription } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { CountdownTimerService } from './services/countdown-timer.service';

@Component({
  selector: 'app-root',
  template: `
    <div *ngIf="errorMessage">{{ errorMessage }}</div>
    <div *ngIf="!errorMessage">
      Seconds left to deadline:
      {{ secondsLeft !== undefined ? secondsLeft : 'Loading...' }}
    </div>
    <div>Set of hardware cameras will suffice= {{ result }}</div>
  `,
})
export class AppComponent {
  secondsLeft: number | undefined;
  errorMessage: string | undefined;
  private countdownSubscription: Subscription | undefined;
  private timerSubscription: Subscription | undefined;

  desiredRange = {
    distance: [0.5, 10], // distance range
    light: [100, 1000], // level range
  };

  cameras = [
    {
      distance: [0, 5],
      light: [50, 200],
    },
    {
      distance: [4, 10],
      light: [150, 500],
    },
    {
      distance: [6, 15],
      light: [400, 1200],
    },
  ];

  result?: any;

  constructor(private deadlineService: CountdownTimerService) { }

  ngOnInit(): void {
    //------------------------------------------Angular assignment -------------------------------------------------------------
    this.fetchDeadline();

    //------------------------------------------General Assignment --------------------------------------------------------------
    this.secondAssignment();
  }

  fetchDeadline(): void {
    this.countdownSubscription = this.deadlineService
      .getSecondsLeft()
      .pipe(
        catchError((error) => {
          this.errorMessage =
            'Failed to fetch deadline, Some issues with the API. Please try again later.';
          return [];
        })
      )
      .subscribe((secondsLeft) => {
        console.log('secondsLeft', secondsLeft);

        this.secondsLeft = secondsLeft;
        this.startCountdown();
      });
  }

  startCountdown(): void {
    this.timerSubscription = interval(1000).subscribe(() => {
      if (this.secondsLeft !== undefined && this.secondsLeft > 0) {
        this.secondsLeft--;
      } else if (this.secondsLeft === 0) {
        this.fetchDeadline();
      }
    });
  }

  secondAssignment() {
    function canCoverRange(desiredRange: any, cameras: any) {
      const [desiredMinDistance, desiredMaxDistance] = desiredRange.distance;
      const [desiredMinLight, desiredMaxLight] = desiredRange.light;

      // Filter cameras that cover part of the desired range
      const coveringCameras = cameras.filter((camera: any) => {
        const [cameraMinDistance, cameraMaxDistance] = camera.distance;
        const [cameraMinLight, cameraMaxLight] = camera.light;

        const coversDistance =
          cameraMaxDistance >= desiredMinDistance &&
          cameraMinDistance <= desiredMaxDistance;
        const coversLight =
          cameraMaxLight >= desiredMinLight &&
          cameraMinLight <= desiredMaxLight;

        return coversDistance && coversLight;
      });

      // Checkig if combined ranges of covering cameras cover the desired range
      const combinedRange = coveringCameras.reduce(
        (range: any, camera: any) => {
          const [cameraMinDistance, cameraMaxDistance] = camera.distance;
          const [cameraMinLight, cameraMaxLight] = camera.light;

          return {
            distance: [
              Math.min(range.distance[0], cameraMinDistance),
              Math.max(range.distance[1], cameraMaxDistance),
            ],
            light: [
              Math.min(range.light[0], cameraMinLight),
              Math.max(range.light[1], cameraMaxLight),
            ],
          };
        },
        { distance: [Infinity, -Infinity], light: [Infinity, -Infinity] }
      );

      const coversDistanceRange =
        combinedRange.distance[0] <= desiredMinDistance &&
        combinedRange.distance[1] >= desiredMaxDistance;
      const coversLightRange =
        combinedRange.light[0] <= desiredMinLight &&
        combinedRange.light[1] >= desiredMaxLight;

      return coversDistanceRange && coversLightRange;
    }

    this.result = canCoverRange(this.desiredRange, this.cameras);
  }

  ngOnDestroy(): void {
    this.countdownSubscription?.unsubscribe();
    this.timerSubscription?.unsubscribe();
  }
}
