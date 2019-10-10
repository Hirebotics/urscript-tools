FROM ubuntu:18.04

ARG ROBOT=UR10
ARG SIMULATOR_DIR=/ursimulator
ARG SIMULATOR_DOWNLOAD_URL=https://s3-eu-west-1.amazonaws.com/ur-support-site/51847/URSim_Linux-5.3.1.64192.tar.gz

RUN apt-get clean
RUN apt-get update
RUN apt-get install -y xterm xvfb sudo wget lib32gcc1 lib32stdc++6 libc6-i386 git nodejs npm libcap2-bin
RUN ln -s /usr/bin/sudo /usr/bin/pkexec

RUN mkdir -p $SIMULATOR_DIR
RUN mkdir -p /root/Desktop

WORKDIR $SIMULATOR_DIR

RUN echo Download Simulator - $SIMULATOR_DOWNLOAD_URL
RUN wget -nc $SIMULATOR_DOWNLOAD_URL
RUN export SIMULATOR_FILE=$(basename $SIMULATOR_DOWNLOAD_URL) && tar --strip-components=2 -xvf $SIMULATOR_FILE

RUN xvfb-run ./install.sh

# Following enables modbus server to be launched by the URControl process
RUN sudo setcap cap_net_bind_service+ep URControl
RUN echo "/opt/urtool-3.0/lib/" > /etc/ld.so.conf.d/77urcontrol.conf
RUN ldconfig

RUN mv .urcontrol/urcontrol.conf.$ROBOT .urcontrol/urcontrol.conf
COPY safety.conf .urcontrol/safety.conf

RUN echo "LD_LIBRARY_PATH=/opt/urtool-3.0/lib HOME=/ursimulator /ursimulator/./URControl -r | tee /ursimulator/URControl.log" > run-controller.sh
RUN chmod a+x run-controller.sh

EXPOSE 30001
EXPOSE 30002
EXPOSE 30003
EXPOSE 30004

ENTRYPOINT ["/bin/bash", "-c", "/ursimulator/run-controller.sh"]